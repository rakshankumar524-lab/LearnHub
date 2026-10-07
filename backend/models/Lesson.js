const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Lesson", lessonSchema);