const express = require("express");
const router = express.Router();

const Lesson = require("../models/Lesson");
const Course = require("../models/Course");
const { authenticate, requireRole } = require("../middleware/authorization");

// ADD LESSON
router.post("/lessons", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const courseName = req.body.courseName?.trim();
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const videoUrl = req.body.videoUrl?.trim() || "";

    if (!courseName || !title || !description) {
      return res.status(400).json({ success: false, message: "Course, lesson title, and description are required" });
    }
    if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
      return res.status(400).json({ success: false, message: "Video URL must begin with http:// or https://" });
    }
    if (!(await Course.exists({
      $expr: { $eq: [{ $trim: { input: "$title" } }, courseName] },
    }))) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const lesson = new Lesson({ courseName, title, description, videoUrl });

    await lesson.save();

    res.status(201).json({
      success: true,
      message: "Lesson Added Successfully",
      lesson: lesson,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Lesson Creation Failed",
    });
  }
});

// GET ALL LESSONS
router.get("/lessons", authenticate, async (req, res) => {
  try {
    const lessons = await Lesson.find();

    res.status(200).json({
      success: true,
      lessons: lessons,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to Fetch Lessons",
    });
  }
});

// GET LESSONS BY COURSE
router.get("/lessons/:courseName", authenticate, async (req, res) => {
  try {
    const lessons = await Lesson.find({
      courseName: req.params.courseName,
    });

    res.status(200).json({
      success: true,
      lessons: lessons,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to Fetch Lessons",
    });
  }
});

module.exports = router;