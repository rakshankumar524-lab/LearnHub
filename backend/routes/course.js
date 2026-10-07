const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const { authenticate, requireRole } = require("../middleware/authorization");

// CREATE COURSE
router.post("/courses", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const { title, instructor, category, duration, description, price } = req.body;
    if (![title, instructor, category, duration, description].every((value) => typeof value === "string" && value.trim()) || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Complete all course fields with a valid non-negative price" });
    }

    const course = new Course({ title: title.trim(), instructor: instructor.trim(), category: category.trim(), duration: duration.trim(), description: description.trim(), price: Number(price) });

    await course.save();

    res.status(201).json({
      success: true,
      message: "Course Created Successfully",
      course: course,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Course Creation Failed",
    });
  }
});

// READ ALL COURSES
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find();

    res.status(200).json({
      success: true,
      courses: courses.map((course) => ({
        ...course.toObject(),
        title: course.title.trim(),
      })),
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to Fetch Courses",
    });
  }
});

// UPDATE COURSE
router.put("/courses/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const existingCourse = await Course.findById(req.params.id);
    if (!existingCourse) {
      return res.status(404).json({ success: false, message: "Course Not Found" });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after", runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course Not Found",
      });
    }

    if (existingCourse.title !== course.title) {
      await Promise.all([
        Lesson.updateMany({ courseName: existingCourse.title }, { courseName: course.title }),
        Enrollment.updateMany({ courseName: existingCourse.title }, { courseName: course.title }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Course Updated Successfully",
      course: course,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Course Update Failed",
    });
  }
});

// DELETE COURSE
router.delete("/courses/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course Not Found",
      });
    }

    await Promise.all([
      Lesson.deleteMany({ courseName: course.title }),
      Enrollment.deleteMany({ courseName: course.title }),
    ]);

    res.status(200).json({
      success: true,
      message: "Course Deleted Successfully",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Course Delete Failed",
    });
  }
});

module.exports = router;