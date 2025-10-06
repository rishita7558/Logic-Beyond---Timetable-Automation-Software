const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Course = require('../models/Course');
const Instructor = require('../models/Instructor');
const Room = require('../models/Room');

// Get all timetables
router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.find().sort({ createdAt: -1 });
    res.json({ results: timetables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific timetable
router.get('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new timetable
router.post('/', async (req, res) => {
  try {
    const timetable = new Timetable(req.body);
    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate timetable automatically
router.post('/generate', async (req, res) => {
  try {
    const { timetable_id } = req.body;
    
    // Get all necessary data
    const courses = await Course.find();
    const instructors = await Instructor.find();
    const rooms = await Room.find();
    
    // Implement your scheduling algorithm here
    const generatedSessions = await generateTimetableSessions(courses, instructors, rooms);
    
    const timetable = await Timetable.findByIdAndUpdate(
      timetable_id,
      { 
        sessions: generatedSessions,
        is_generated: true,
        generated_at: new Date()
      },
      { new: true }
    );
    
    res.json({
      created_sessions: generatedSessions.length,
      conflicts: [],
      timetable
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check conflicts
router.get('/:id/conflicts', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    const conflicts = await detectConflicts(timetable.sessions);
    res.json({ conflicts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get timetable statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    const statistics = await calculateStatistics(timetable);
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
async function generateTimetableSessions(courses, instructors, rooms) {
  // Implement your genetic algorithm or constraint satisfaction here
  // This is a simplified version
  const sessions = [];
  
  for (const course of courses) {
    // Find available instructor
    const availableInstructor = instructors.find(instructor => 
      instructor.preferred_courses.includes(course.code)
    );
    
    // Find available room
    const availableRoom = rooms.find(room => 
      room.type === (course.type === 'Lab' ? 'Lab' : 'Lecture Hall') &&
      room.capacity >= 30
    );
    
    if (availableInstructor && availableRoom) {
      sessions.push({
        course_code: course.code,
        course_name: course.name,
        instructor: availableInstructor.name,
        room: availableRoom.number,
        start_time: '09:00',
        end_time: '10:00',
        type: course.type,
        day: Math.floor(Math.random() * 5), // Random day 0-4 (Mon-Fri)
        color: getRandomColor()
      });
    }
  }
  
  return sessions;
}

function detectConflicts(sessions) {
  const conflicts = [];
  // Implement conflict detection logic
  return conflicts;
}

function calculateStatistics(timetable) {
  const sessions = timetable.sessions || [];
  return {
    total_sessions: sessions.length,
    sections: timetable.sections?.length || 0,
    courses: new Set(sessions.map(s => s.course_code)).size,
    instructors: new Set(sessions.map(s => s.instructor)).size,
    session_breakdown: {
      lectures: sessions.filter(s => s.type === 'Lecture').length,
      tutorials: sessions.filter(s => s.type === 'Tutorial').length,
      practicals: sessions.filter(s => s.type === 'Lab').length
    },
    daily_distribution: [0,1,2,3,4,5,6].map(day => 
      sessions.filter(s => s.day === day).length
    )
  };
}

function getRandomColor() {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = router;