import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TimetableGenerator.css';

// API configuration
const API_BASE_URL = 'http://localhost:5000';

const TimetableGenerator = () => {
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState({});
    const [classes, setClasses] = useState([]);
    const [timetable, setTimetable] = useState(null);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [periodsPerDay, setPeriodsPerDay] = useState(8);
    const [workingDays, setWorkingDays] = useState(5);

    useEffect(() => {
        // Check backend health and existing timetable
        checkBackendHealth();
        checkExistingTimetable();
    }, []);

    const checkBackendHealth = async () => {
        try {
            await axios.get(`${API_BASE_URL}/health`);
            setMessage('Backend connected successfully');
        } catch (error) {
            setMessage('Backend connection failed. Make sure the server is running on port 5000.');
            console.error('Backend health check failed:', error);
        }
    };

    const checkExistingTimetable = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/get_timetable`);
            if (response.data.status === 'generated') {
                setTimetable(response.data.timetable);
                setStatus('generated');
                setMessage('Timetable loaded successfully');
            }
        } catch (error) {
            console.log('No existing timetable found');
        }
    };

    const addSubject = () => {
        const newSubject = {
            id: Date.now(),
            name: '',
            teacher: '',
            class: '',
            periodsPerWeek: 1
        };
        setSubjects([...subjects, newSubject]);
    };

    const updateSubject = (id, field, value) => {
        setSubjects(subjects.map(subject => 
            subject.id === id ? { ...subject, [field]: value } : subject
        ));
    };

    const removeSubject = (id) => {
        setSubjects(subjects.filter(subject => subject.id !== id));
    };

    const addTeacher = () => {
        const teacherName = prompt('Enter teacher name:');
        if (teacherName && !teachers[teacherName]) {
            setTeachers({
                ...teachers,
                [teacherName]: { available: true }
            });
        }
    };

    const addClass = () => {
        const className = prompt('Enter class name:');
        if (className && !classes.includes(className)) {
            setClasses([...classes, className]);
        }
    };

    const removeTeacher = (teacherName) => {
        const newTeachers = { ...teachers };
        delete newTeachers[teacherName];
        setTeachers(newTeachers);
    };

    const removeClass = (className) => {
        setClasses(classes.filter(cls => cls !== className));
    };

    const generateTimetable = async () => {
        // Validate data
        if (subjects.length === 0) {
            setMessage('Please add at least one subject');
            return;
        }
        if (Object.keys(teachers).length === 0) {
            setMessage('Please add at least one teacher');
            return;
        }
        if (classes.length === 0) {
            setMessage('Please add at least one class');
            return;
        }

        // Validate subject data
        const invalidSubjects = subjects.filter(subject => 
            !subject.name || !subject.teacher || !subject.class
        );
        
        if (invalidSubjects.length > 0) {
            setMessage('Please fill all fields for all subjects');
            return;
        }

        setStatus('generating');
        setMessage('Generating timetable...');

        try {
            const requestData = {
                subjects,
                teachers,
                classes,
                periodsPerDay,
                workingDays
            };

            console.log('Sending data to backend:', requestData);

            const response = await axios.post(`${API_BASE_URL}/generate_timetable`, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            console.log('Response from backend:', response.data);

            if (response.data.status === 'generated') {
                setTimetable(response.data.timetable);
                setStatus('generated');
                setMessage('Timetable generated successfully!');
            } else {
                setStatus('not generated');
                setMessage(response.data.message || 'Failed to generate timetable');
            }
        } catch (error) {
            console.error('Error generating timetable:', error);
            setStatus('error');
            if (error.code === 'ERR_NETWORK') {
                setMessage('Cannot connect to backend. Make sure the server is running on http://localhost:5000');
            } else {
                setMessage(error.response?.data?.message || 'Error generating timetable. Please try again.');
            }
        }
    };

    const renderTimetable = () => {
        if (!timetable || Object.keys(timetable).length === 0) {
            return <div>No timetable data available</div>;
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].slice(0, workingDays);

        return Object.keys(timetable).map(className => (
            <div key={className} className="class-timetable">
                <h3>Class: {className}</h3>
                <table className="timetable-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            {days.map(day => (
                                <th key={day}>{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: periodsPerDay }, (_, periodIndex) => (
                            <tr key={periodIndex}>
                                <td className="period-number">{periodIndex + 1}</td>
                                {days.map(day => {
                                    const slot = timetable[className]?.[day]?.[periodIndex];
                                    return (
                                        <td key={day} className="timetable-slot">
                                            {slot && typeof slot === 'object' ? (
                                                <div className={slot.subject === 'Free' ? 'free-period' : 'subject-period'}>
                                                    <strong>{slot.subject || 'Free'}</strong>
                                                    {slot.teacher && slot.subject !== 'Free' && (
                                                        <div className="teacher-name">{slot.teacher}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="free-period">Free</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ));
    };

    return (
        <div className="timetable-generator">
            <h2>Timetable Generator</h2>
            
            {/* Configuration Section */}
            <div className="config-section">
                <h3>Configuration</h3>
                <div className="config-controls">
                    <label>
                        Periods per Day:
                        <input 
                            type="number" 
                            value={periodsPerDay} 
                            onChange={(e) => setPeriodsPerDay(parseInt(e.target.value) || 8)}
                            min="1"
                            max="12"
                        />
                    </label>
                    <label>
                        Working Days:
                        <input 
                            type="number" 
                            value={workingDays} 
                            onChange={(e) => setWorkingDays(parseInt(e.target.value) || 5)}
                            min="1"
                            max="7"
                        />
                    </label>
                </div>
            </div>

            {/* Subjects Section */}
            <div className="subjects-section">
                <h3>Subjects</h3>
                <button onClick={addSubject} className="add-btn">Add Subject</button>
                {subjects.map(subject => (
                    <div key={subject.id} className="subject-item">
                        <input
                            type="text"
                            placeholder="Subject Name"
                            value={subject.name}
                            onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Teacher"
                            value={subject.teacher}
                            onChange={(e) => updateSubject(subject.id, 'teacher', e.target.value)}
                            list="teachers-list"
                        />
                        <input
                            type="text"
                            placeholder="Class"
                            value={subject.class}
                            onChange={(e) => updateSubject(subject.id, 'class', e.target.value)}
                            list="classes-list"
                        />
                        <input
                            type="number"
                            placeholder="Periods/Week"
                            value={subject.periodsPerWeek}
                            onChange={(e) => updateSubject(subject.id, 'periodsPerWeek', parseInt(e.target.value) || 1)}
                            min="1"
                        />
                        <button onClick={() => removeSubject(subject.id)} className="remove-btn">Remove</button>
                    </div>
                ))}
                
                <datalist id="teachers-list">
                    {Object.keys(teachers).map(teacher => (
                        <option key={teacher} value={teacher} />
                    ))}
                </datalist>
                
                <datalist id="classes-list">
                    {classes.map(cls => (
                        <option key={cls} value={cls} />
                    ))}
                </datalist>
            </div>

            {/* Teachers Section */}
            <div className="teachers-section">
                <h3>Teachers</h3>
                <button onClick={addTeacher} className="add-btn">Add Teacher</button>
                <div className="teachers-list">
                    {Object.keys(teachers).map(teacherName => (
                        <div key={teacherName} className="teacher-item">
                            {teacherName}
                            <button onClick={() => removeTeacher(teacherName)} className="remove-small-btn">×</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Classes Section */}
            <div className="classes-section">
                <h3>Classes</h3>
                <button onClick={addClass} className="add-btn">Add Class</button>
                <div className="classes-list">
                    {classes.map(className => (
                        <div key={className} className="class-item">
                            {className}
                            <button onClick={() => removeClass(className)} className="remove-small-btn">×</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <div className="generate-section">
                <button 
                    onClick={generateTimetable} 
                    disabled={status === 'generating'}
                    className="generate-btn"
                >
                    {status === 'generating' ? 'Generating...' : 'Generate Timetable'}
                </button>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`status-message ${status}`}>
                    {message}
                </div>
            )}

            {/* Timetable Display */}
            {status === 'generated' && timetable && (
                <div className="timetable-display">
                    <h3>Generated Timetable</h3>
                    {renderTimetable()}
                </div>
            )}
        </div>
    );
};

export default TimetableGenerator;