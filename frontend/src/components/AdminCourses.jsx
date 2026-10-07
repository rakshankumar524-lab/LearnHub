import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "../api";

function AdminCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [lessonCourse, setLessonCourse] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [editId, setEditId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("http://localhost:8000/courses"),
      fetch("http://localhost:8000/lessons", { headers: authHeaders() }),
    ])
      .then(async ([courseResponse, lessonResponse]) => {
        const [courseData, lessonData] = await Promise.all([courseResponse.json(), lessonResponse.json()]);
        if (!courseResponse.ok || !courseData.success) throw new Error(courseData.message || "Unable to load courses");
        if (!lessonResponse.ok || !lessonData.success) throw new Error(lessonData.message || "Unable to load lessons");
        if (active) {
          setCourses(courseData.courses);
          setLessons(lessonData.lessons);
        }
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message || "Unable to connect to server");
      });
    return () => { active = false; };
  }, []);

  // CLEAR COURSE FORM
  const clearForm = () => {
    setTitle("");
    setInstructor("");
    setCategory("");
    setDuration("");
    setDescription("");
    setPrice("");
    setEditId(null);
  };

  // ADD / UPDATE COURSE
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    const courseData = {
      title,
      instructor,
      category,
      duration,
      description,
      price: Number(price),
    };

    try {
      let response;

      if (editId) {
        response = await fetch(
          `http://localhost:8000/courses/${editId}`,
          {
            method: "PUT",
            headers: authHeaders(true),
            body: JSON.stringify(courseData),
          }
        );
      } else {
        response = await fetch(
          "http://localhost:8000/courses",
          {
            method: "POST",
            headers: authHeaders(true),
            body: JSON.stringify(courseData),
          }
        );
      }

      const data = await response.json();

      if (response.ok && data.success) {
        if (editId) {
          const previousCourse = courses.find((course) => course._id === editId);
          setCourses((current) => current.map((course) => course._id === editId ? data.course : course));
          if (previousCourse && previousCourse.title !== data.course.title) {
            setLessons((current) => current.map((lesson) => lesson.courseName === previousCourse.title
              ? { ...lesson, courseName: data.course.title }
              : lesson));
          }
        } else {
          setCourses((current) => [...current, data.course]);
        }
        setNotice(editId ? "Course updated successfully." : "Course added successfully.");
        clearForm();
      } else {
        setError(data.message || "Unable to save course");
      }
    } catch {
      setError("Unable to connect to server");
    }
  };

  // EDIT COURSE
  const handleEdit = (course) => {
    setEditId(course._id);

    setTitle(course.title);
    setInstructor(course.instructor);
    setCategory(course.category);
    setDuration(course.duration);
    setDescription(course.description);
    setPrice(course.price);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE COURSE
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError("");
      setNotice("");
      const response = await fetch(
        `http://localhost:8000/courses/${id}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setCourses((current) => current.filter((course) => course._id !== id));
        const deletedCourse = courses.find((course) => course._id === id);
        if (deletedCourse) {
          setLessons((current) => current.filter((lesson) => lesson.courseName !== deletedCourse.title));
        }
        setNotice("Course deleted successfully.");
      } else {
        setError(data.message || "Unable to delete course");
      }
    } catch {
      setError("Unable to connect to server");
    }
  };

  // ADD LESSON
  const handleAddLesson = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    const lessonData = {
      courseName: lessonCourse,
      title: lessonTitle,
      description: lessonDescription,
      videoUrl: videoUrl,
    };

    try {
      const response = await fetch(
        "http://localhost:8000/lessons",
        {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify(lessonData),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setLessons((current) => [...current, data.lesson]);
        setNotice("Lesson added successfully.");
        setLessonCourse("");
        setLessonTitle("");
        setLessonDescription("");
        setVideoUrl("");

      } else {
        setError(data.message || "Unable to add lesson");
      }
    } catch {
      setError("Unable to connect to server");
    }
  };

  return (
    <div className="admin-page">

      {/* HEADER */}
      <div className="admin-header">

        <div className="admin-header-top">

          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage courses and learning content.</p>
          </div>

          <button
            className="admin-home-btn"
            onClick={() => navigate("/home")}
          >
            ← Back to Home
          </button>

        </div>

      </div>

      <section className="admin-summary" aria-label="Content summary">
        <div className="admin-summary-card">
          <span>Total Courses</span>
          <strong>{courses.length}</strong>
        </div>
        <div className="admin-summary-card">
          <span>Total Lessons</span>
          <strong>{lessons.length}</strong>
        </div>
      </section>

      {(notice || error) && (
        <p className={`admin-notice ${error ? "error-message" : "success-message"}`} role={error ? "alert" : "status"}>
          {error || notice}
        </p>
      )}

      {/* COURSE FORM */}
      <div className="admin-form-card" id="course-form">

        <h2>
          {editId ? "Edit Course" : "Course Details"}
        </h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Course Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Instructor"
            value={instructor}
            onChange={(e) =>
              setInstructor(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Duration"
            value={duration}
            onChange={(e) =>
              setDuration(e.target.value)
            }
            required
          />

          <textarea
            placeholder="Course Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            required
          />

          <input
            type="number"
            placeholder="Price"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            required
          />

          <div className="admin-form-buttons">

            <button type="submit">
              {editId
                ? "Update Course"
                : "Add Course"}
            </button>

            {editId && (
              <button
                type="button"
                onClick={clearForm}
                className="cancel-btn"
              >
                Cancel
              </button>
            )}

          </div>

        </form>

      </div>

      {/* ALL COURSES */}
      <div className="admin-course-section">

        <div className="admin-section-heading">
          <h2>Course Management</h2>
          <button type="button" onClick={() => document.getElementById("course-form")?.scrollIntoView({ behavior: "smooth" })}>
            Add New Course
          </button>
        </div>

        <div className="admin-course-grid">

          {courses.length === 0 ? (
            <div className="empty-admin-courses"><h3>No courses available</h3><p>Add a course to get started.</p></div>
          ) : courses.map((course) => (

            <div
              className="admin-course-card"
              key={course._id}
            >

              <h3>{course.title}</h3>

              <p>
                <strong>Instructor:</strong>{" "}
                {course.instructor}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {course.category}
              </p>

              <p>
                <strong>Duration:</strong>{" "}
                {course.duration}
              </p>

              <p>
                <strong>Price:</strong>{" "}
                ₹{course.price}
              </p>

              <div className="admin-card-buttons">

                <button
                  className="edit-btn"
                  onClick={() => handleEdit(course)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() =>
                    handleDelete(course._id)
                  }
                >
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

      <div className="admin-course-section admin-lesson-section">
        <div className="admin-section-heading">
          <h2>Lesson Management</h2>
        </div>
        {lessons.length === 0 ? (
          <div className="empty-admin-courses"><h3>No lessons available</h3><p>Add a lesson after creating a course.</p></div>
        ) : (
          <div className="admin-course-grid">
            {lessons.map((lesson) => (
              <article className="admin-course-card" key={lesson._id}>
                <h3>{lesson.title}</h3>
                <p><strong>Course:</strong> {lesson.courseName}</p>
                <p>{lesson.description}</p>
                {lesson.videoUrl && <a href={lesson.videoUrl} target="_blank" rel="noreferrer">Video link</a>}
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ADD LESSON */}
      <div className="admin-form-card">

        <h2>Add Lesson</h2>

        <form onSubmit={handleAddLesson}>

          <select
            value={lessonCourse}
            onChange={(e) =>
              setLessonCourse(e.target.value)
            }
            required
          >
            <option value="">
              Select Course
            </option>

            {courses.map((course) => (
              <option
                key={course._id}
                value={course.title}
              >
                {course.title}
              </option>
            ))}

          </select>

          <input
            type="text"
            placeholder="Lesson Title"
            value={lessonTitle}
            onChange={(e) =>
              setLessonTitle(e.target.value)
            }
            required
          />

          <textarea
            placeholder="Lesson Description"
            value={lessonDescription}
            onChange={(e) =>
              setLessonDescription(e.target.value)
            }
            required
          />

          <input
            type="url"
            placeholder="Video URL (optional)"
            value={videoUrl}
            onChange={(e) =>
              setVideoUrl(e.target.value)
            }
          />

          <button type="submit">
            Add Lesson
          </button>

        </form>

      </div>

    </div>
  );
}

export default AdminCourses;