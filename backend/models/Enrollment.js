const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  enrolledDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Enrollment", enrollmentSchema);