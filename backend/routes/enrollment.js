const express = require("express");
const router = express.Router();

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { authenticate, requireRole } = require("../middleware/authorization");

router.post("/enroll", authenticate, requireRole("student"), async (req, res) => {
  try {
    const studentName = req.user.name;
    const email = req.user.email.toLowerCase();
    const courseName = req.body.courseName?.trim();

    if (!studentName || !email || !courseName) {
      return res.status(400).json({ success: false, message: "Student name, email, and course are required" });
    }

    const course = await Course.findOne({
      $expr: { $eq: [{ $trim: { input: "$title" } }, courseName] },
    });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const existingEnrollment = await Enrollment.findOne({ email, courseName });
    if (existingEnrollment) {
      return res.status(409).json({ success: false, message: "You are already enrolled in this course" });
    }

    const enrollment = new Enrollment({
      studentName,
      email,
      courseName,
    });

    await enrollment.save();

    res.status(201).json({
      success: true,
      message: "Course Enrolled Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Enrollment Failed",
    });
  }
});
router.get("/my-courses/:email", authenticate, async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    if (req.user.email.toLowerCase() !== email) {
      return res.status(403).json({ success: false, message: "You can only view your own enrollments" });
    }

    const storedEnrollments = await Enrollment.find({ email }).sort({ enrolledDate: 1 }).lean();
    const enrollments = [...new Map(
      storedEnrollments.map((enrollment) => [enrollment.courseName, enrollment])
    ).values()];

    res.status(200).json({
      success: true,
      enrollments: enrollments,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
});

module.exports = router;