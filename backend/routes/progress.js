const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const CourseProgress = require("../models/CourseProgress");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const { authenticate, requireRole } = require("../middleware/authorization");

async function getProgressPayload(courseName, progressRecord) {
  const lessons = await Lesson.find({ courseName }).select("_id").lean();
  const lessonIds = new Set(lessons.map((lesson) => String(lesson._id)));
  const completedLessons = (progressRecord?.completedLessons || [])
    .map(String)
    .filter((lessonId) => lessonIds.has(lessonId));
  const totalLessons = lessons.length;
  const percentage = totalLessons === 0
    ? 0
    : Math.round((completedLessons.length / totalLessons) * 100);

  return {
    success: true,
    courseName,
    completedLessons,
    completedCount: completedLessons.length,
    totalLessons,
    progress: percentage,
    completedAt: percentage === 100 ? progressRecord?.completedAt || null : null,
  };
}

async function isEnrolled(studentEmail, courseName) {
  return Enrollment.exists({ email: studentEmail, courseName });
}

router.get("/progress/:courseName", authenticate, requireRole("student"), async (req, res) => {
  try {
    const courseName = req.params.courseName.trim();
    const studentEmail = req.user.email.toLowerCase();

    if (!courseName) {
      return res.status(400).json({ success: false, message: "Course name is required" });
    }
    if (!(await isEnrolled(studentEmail, courseName))) {
      return res.status(403).json({ success: false, message: "You must be enrolled to view course progress" });
    }

    const progressRecord = await CourseProgress.findOne({ studentEmail, courseName }).lean();
    const progress = await getProgressPayload(courseName, progressRecord);
    return res.status(200).json(progress);
  } catch (error) {
    console.error("Failed to fetch course progress:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch course progress" });
  }
});

router.post("/progress/complete", authenticate, requireRole("student"), async (req, res) => {
  try {
    const courseName = typeof req.body.courseName === "string" ? req.body.courseName.trim() : "";
    const lessonId = req.body.lessonId;
    const studentEmail = req.user.email.toLowerCase();

    if (!courseName || !mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ success: false, message: "A course name and valid lesson ID are required" });
    }
    if (!(await isEnrolled(studentEmail, courseName))) {
      return res.status(403).json({ success: false, message: "You must be enrolled to update course progress" });
    }
    if (!(await Lesson.exists({ _id: lessonId, courseName }))) {
      return res.status(404).json({ success: false, message: "Lesson not found for this course" });
    }

    const filter = { studentEmail, courseName };
    let progressRecord;
    try {
      progressRecord = await CourseProgress.findOneAndUpdate(
        filter,
        { $addToSet: { completedLessons: lessonId } },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      progressRecord = await CourseProgress.findOneAndUpdate(
        filter,
        { $addToSet: { completedLessons: lessonId } },
        { returnDocument: "after" },
      );
      if (!progressRecord) throw error;
    }

    let progress = await getProgressPayload(courseName, progressRecord);
    if (progress.progress === 100 && !progressRecord.completedAt) {
      progressRecord.completedAt = new Date();
      await progressRecord.save();
      progress = await getProgressPayload(courseName, progressRecord);
    }

    return res.status(200).json(progress);
  } catch (error) {
    console.error("Failed to update course progress:", error);
    return res.status(500).json({ success: false, message: "Failed to update course progress" });
  }
});

module.exports = router;
