const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  building: { type: String, required: true },
  capacity: { type: Number, required: true },
  type: { type: String, enum: ['Lecture Hall', 'Lab', 'Tutorial Room'], required: true },
  equipment: [String],
  availability: [{
    day: Number,
    time_slots: [{
      start: String,
      end: String
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);