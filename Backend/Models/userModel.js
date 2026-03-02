const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    itNumber: {
      type: String,
      required: true,
      unique: true, // Ensures the IT number is unique for each user
    },
    name: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true, // (e.g., 1st year, 2nd year)
    },
    faculty: {
      type: String,
      required: true, // (e.g., Engineering, Business)
    },
    contactNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Email should be unique
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['organizer', 'participant'], // Only these two roles allowed
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;