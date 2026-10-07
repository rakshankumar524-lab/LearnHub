const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  instructor: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    required: true,
  },

  duration: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

module.exports = mongoose.model("Course", courseSchema);