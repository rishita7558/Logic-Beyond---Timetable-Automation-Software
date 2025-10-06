const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  course_code: { type: String, required: true },
  course_name: { type: String, required: true },
  instructor: { type: String, required: true },
  room: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  type: { type: String, enum: ['Lecture', 'Lab', 'Tutorial'], required: true },
  day: { type: Number, min: 0, max: 6, required: true }, // 0=Monday, 6=Sunday
  color: { type: String, default: '#1890ff' }
});

const timetableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  semester: String,
  academic_year: String,
  sections: [String],
  sessions: [sessionSchema],
  is_generated: { type: Boolean, default: false },
  generated_at: Date,
  constraints: {
    working_hours: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '18:00' }
    },
    max_hours_per_day: { type: Number, default: 8 },
    break_times: [{
      start: String,
      end: String
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);