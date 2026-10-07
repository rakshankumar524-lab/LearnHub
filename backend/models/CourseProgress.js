const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema({
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
  }],
  completedAt: {
    type: Date,
    default: null,
  },
});

courseProgressSchema.index({ studentEmail: 1, courseName: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", courseProgressSchema);
