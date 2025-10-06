from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from urllib.parse import quote_plus
import json
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = app.logger

# MongoDB connection - UPDATE WITH YOUR ACTUAL CREDENTIALS
# Replace 'your_password' with your actual password
username = "Rishita"
password = "Rishi@1602"  # REPLACE WITH YOUR ACTUAL PASSWORD
cluster_url = "cluster0.9fpagaj.mongodb.net"  # REPLACE WITH YOUR ACTUAL CLUSTER URL

# Properly encode username and password
encoded_username = quote_plus(username)
encoded_password = quote_plus(password)

MONGODB_URI = f"mongodb+srv://{encoded_username}:{encoded_password}@{cluster_url}/?retryWrites=true&w=majority"

def get_database():
    try:
        client = MongoClient(MONGODB_URI)
        # Test the connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        return client.timetable_db
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        return None

# Store generated timetable globally (fallback)
generated_timetable = None

@app.route('/generate_timetable', methods=['POST'])
def generate_timetable():
    global generated_timetable
    try:
        data = request.get_json()
        logger.info(f"Received data for timetable generation")
        
        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400
        
        # Extract subjects, teachers, and constraints
        subjects = data.get('subjects', [])
        teachers = data.get('teachers', {})
        classes = data.get('classes', [])
        periods_per_day = data.get('periodsPerDay', 8)
        working_days = data.get('workingDays', 5)
        
        logger.info(f"Processing: {len(subjects)} subjects, {len(teachers)} teachers, {len(classes)} classes")
        
        # Validate input data
        if not subjects or not teachers or not classes:
            return jsonify({
                'status': 'not generated', 
                'message': 'Incomplete data provided. Please check subjects, teachers, and classes.'
            }), 400
        
        # Generate timetable
        timetable = generate_timetable_logic(subjects, teachers, classes, periods_per_day, working_days)
        
        if timetable:
            generated_timetable = timetable
            
            # Save to MongoDB
            db = get_database()
            if db:
                try:
                    timetable_doc = {
                        'name': f'Timetable_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                        'subjects': subjects,
                        'teachers': teachers,
                        'classes': classes,
                        'periods_per_day': periods_per_day,
                        'working_days': working_days,
                        'timetable_data': timetable,
                        'created_at': datetime.now(),
                        'status': 'generated'
                    }
                    result = db.timetables.insert_one(timetable_doc)
                    logger.info(f"Timetable saved to MongoDB with ID: {result.inserted_id}")
                except Exception as e:
                    logger.error(f"Failed to save to MongoDB: {str(e)}")
            
            logger.info("Timetable generated successfully")
            return jsonify({
                'status': 'generated',
                'timetable': timetable,
                'message': 'Timetable generated successfully'
            })
        else:
            logger.warning("Timetable generation failed")
            return jsonify({
                'status': 'not generated',
                'message': 'Unable to generate timetable with given constraints'
            }), 400
            
    except Exception as e:
        logger.error(f"Error generating timetable: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }), 500

def generate_timetable_logic(subjects, teachers, classes, periods_per_day, working_days):
    """
    Core timetable generation logic
    """
    try:
        timetable = {}
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][:working_days]
        
        # Initialize timetable structure
        for class_name in classes:
            timetable[class_name] = {}
            for day in days:
                timetable[class_name][day] = ['Free' for _ in range(periods_per_day)]
        
        # Assign subjects to periods
        teacher_schedule = {}  # Track teacher availability
        
        for class_name in classes:
            class_subjects = [subj for subj in subjects if subj.get('class') == class_name]
            
            if not class_subjects:
                continue
                
            # Assign subjects to this class
            for subject_data in class_subjects:
                subject_name = subject_data.get('name', '')
                subject_teacher = subject_data.get('teacher', '')
                subject_periods = subject_data.get('periodsPerWeek', 1)
                
                if not subject_name or not subject_teacher:
                    continue
                
                periods_assigned = 0
                max_attempts = periods_per_day * working_days * 2
                
                for attempt in range(max_attempts):
                    if periods_assigned >= subject_periods:
                        break
                        
                    # Try to find an available slot
                    for day in days:
                        if periods_assigned >= subject_periods:
                            break
                            
                        for period in range(periods_per_day):
                            if (timetable[class_name][day][period] == 'Free' and 
                                is_teacher_available(teacher_schedule, subject_teacher, day, period)):
                                
                                # Assign the subject
                                timetable[class_name][day][period] = {
                                    'subject': subject_name,
                                    'teacher': subject_teacher
                                }
                                
                                # Update teacher schedule
                                if subject_teacher not in teacher_schedule:
                                    teacher_schedule[subject_teacher] = {}
                                if day not in teacher_schedule[subject_teacher]:
                                    teacher_schedule[subject_teacher][day] = []
                                teacher_schedule[subject_teacher][day].append(period)
                                
                                periods_assigned += 1
                                break
        
        # Fill remaining slots with free periods
        for class_name in classes:
            for day in days:
                for period in range(periods_per_day):
                    if timetable[class_name][day][period] == 'Free':
                        timetable[class_name][day][period] = {
                            'subject': 'Free',
                            'teacher': ''
                        }
        
        logger.info(f"Generated timetable for {len(classes)} classes")
        return timetable
        
    except Exception as e:
        logger.error(f"Error in timetable logic: {str(e)}")
        return None

def is_teacher_available(teacher_schedule, teacher, day, period):
    """
    Check if teacher is available at given day and period
    """
    if teacher not in teacher_schedule:
        return True
    if day not in teacher_schedule[teacher]:
        return True
    return period not in teacher_schedule[teacher][day]

@app.route('/get_timetable', methods=['GET'])
def get_timetable():
    global generated_timetable
    
    # Try to get from MongoDB first
    db = get_database()
    if db:
        try:
            latest_timetable = db.timetables.find_one(
                {'status': 'generated'}, 
                sort=[('created_at', -1)]
            )
            if latest_timetable:
                return jsonify({
                    'status': 'generated',
                    'timetable': latest_timetable['timetable_data'],
                    'message': 'Timetable loaded from database'
                })
        except Exception as e:
            logger.error(f"Error fetching from MongoDB: {str(e)}")
    
    # Fallback to in-memory timetable
    if generated_timetable:
        return jsonify({
            'status': 'generated',
            'timetable': generated_timetable,
            'message': 'Timetable loaded from memory'
        })
    else:
        return jsonify({
            'status': 'not generated',
            'message': 'No timetable available. Please generate one first.'
        })

@app.route('/timetables', methods=['GET'])
def get_all_timetables():
    """Get all saved timetables"""
    db = get_database()
    if not db:
        return jsonify({'status': 'error', 'message': 'Database connection failed'}), 500
    
    try:
        timetables = list(db.timetables.find(
            {}, 
            {'name': 1, 'created_at': 1, 'status': 1, 'classes': 1}
        ).sort('created_at', -1))
        
        # Convert ObjectId to string for JSON serialization
        for timetable in timetables:
            timetable['_id'] = str(timetable['_id'])
            timetable['created_at'] = timetable['created_at'].isoformat()
        
        return jsonify({
            'status': 'success',
            'timetables': timetables
        })
    except Exception as e:
        logger.error(f"Error fetching timetables: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/timetables/<timetable_id>', methods=['GET'])
def get_timetable_by_id(timetable_id):
    """Get specific timetable by ID"""
    db = get_database()
    if not db:
        return jsonify({'status': 'error', 'message': 'Database connection failed'}), 500
    
    try:
        timetable = db.timetables.find_one({'_id': ObjectId(timetable_id)})
        if timetable:
            timetable['_id'] = str(timetable['_id'])
            timetable['created_at'] = timetable['created_at'].isoformat()
            return jsonify({
                'status': 'success',
                'timetable': timetable
            })
        else:
            return jsonify({'status': 'error', 'message': 'Timetable not found'}), 404
    except Exception as e:
        logger.error(f"Error fetching timetable: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/timetables/<timetable_id>', methods=['DELETE'])
def delete_timetable(timetable_id):
    """Delete a timetable"""
    db = get_database()
    if not db:
        return jsonify({'status': 'error', 'message': 'Database connection failed'}), 500
    
    try:
        result = db.timetables.delete_one({'_id': ObjectId(timetable_id)})
        if result.deleted_count > 0:
            return jsonify({'status': 'success', 'message': 'Timetable deleted'})
        else:
            return jsonify({'status': 'error', 'message': 'Timetable not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting timetable: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Health check endpoint with DB check
@app.route('/health', methods=['GET'])
def health_check():
    db = get_database()
    db_status = "connected" if db is not None else "disconnected"  # ← FIXED
    return jsonify({
        'status': 'healthy', 
        'message': 'Backend is running',
        'database': db_status
    })

# Test MongoDB connection endpoint
@app.route('/test_db', methods=['GET'])
def test_db():
    db = get_database()
    if db:
        try:
            # Test the connection
            db.command('ping')
            return jsonify({
                'status': 'success', 
                'message': 'MongoDB connection successful'
            })
        except Exception as e:
            return jsonify({
                'status': 'error', 
                'message': f'MongoDB connection failed: {str(e)}'
            })
    else:
        return jsonify({
            'status': 'error', 
            'message': 'Failed to connect to MongoDB'
        })

if __name__ == '__main__':
    # Test database connection on startup
    db = get_database()
    if db is not None:  # ← FIXED: Check if db is not None
        logger.info("✅ MongoDB connection established")
    else:
        logger.warning("❌ MongoDB connection failed - running in fallback mode")
    
    app.run(debug=True, port=5000, host='0.0.0.0')