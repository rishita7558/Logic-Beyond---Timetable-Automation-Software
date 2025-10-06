const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  day: { type: Number, required: true }, // 0-6
  time_slots: [{
    start: String,
    end: String
  }]
});

const instructorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  max_hours_per_week: { type: Number, default: 20 },
  availability: [availabilitySchema],
  preferred_courses: [String],
  unavailable_times: [{
    day: Number,
    start: String,
    end: String,
    reason: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Instructor', instructorSchema);