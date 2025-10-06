const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  type: { type: String, enum: ['Lecture', 'Lab', 'Tutorial'], required: true },
  hours_per_week: { type: Number, required: true },
  department: String,
  prerequisites: [String],
  instructor_preferences: [String]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);