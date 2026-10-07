import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authHeaders } from "../api";

function getFavoriteCourseIds() {
  try {
    const saved = JSON.parse(localStorage.getItem("learnhub-favorites") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getCourseRatings() {
  try {
    const saved = JSON.parse(localStorage.getItem("learnhub-course-ratings") || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function CourseDetails() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [ratings, setRatings] = useState(getCourseRatings);

  useEffect(() => {
    const saved = getFavoriteCourseIds();
    setIsFavorite(saved.includes(id));
  }, [id]);

  useEffect(() => {
    localStorage.setItem("learnhub-course-ratings", JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {

    fetch("http://localhost:8000/courses")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load course");
        const selectedCourse = data.courses.find((item) => item._id === id);
        setCourse(selectedCourse);
        setLoading(false);
      })
      .catch((fetchError) => {
        setError(fetchError.message || "Unable to connect to server");
        setLoading(false);
      });

  }, [id]);

  const toggleFavorite = () => {
    const saved = getFavoriteCourseIds();
    const nextValue = !saved.includes(id);
    const nextFavorites = nextValue
      ? [...saved, id]
      : saved.filter((courseId) => courseId !== id);

    localStorage.setItem("learnhub-favorites", JSON.stringify(nextFavorites));
    setIsFavorite(nextValue);
  };

  const courseRatingValues = Object.entries(ratings)
    .filter(([courseId]) => courseId === id)
    .map(([, value]) => Number(value))
    .filter((value) => value >= 1 && value <= 5);

  const averageRating = courseRatingValues.length
    ? courseRatingValues.reduce((sum, value) => sum + value, 0) / courseRatingValues.length
    : 0;

  const userRating = Number(ratings[id] || 0);

  const handleRate = (score) => {
    setRatings((current) => ({
      ...current,
      [id]: score,
    }));
  };

  // Loading
  if (loading) {
    return (
      <div className="course-page">

        <div className="course-body">

          <h2>Loading Course...</h2>

        </div>

      </div>
    );
  }


  // Course not found
  if (!course) {

    return (
      <div className="course-page">

        <div className="course-body">

          <h2>{error ? "Unable to load course" : "Course Not Found"}</h2>

          <p>
            {error || "The selected course could not be found."}
          </p>

          <button
            className="enroll-btn"
            onClick={() => navigate("/home")}
          >
            Back to Courses
          </button>

        </div>

      </div>
    );
  }


  // Enroll function
  const handleEnroll = async () => {

    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user) {

      navigate("/", { replace: true });

      return;
    }

    try {

      const response = await fetch(
        "http://localhost:8000/enroll",
        {
          method: "POST",

          headers: authHeaders(true),

          body: JSON.stringify({
            studentName: user.name,
            email: user.email,
            courseName: course.title,
          }),
        }
      );

      const data = await response.json();

      setNotice(response.ok && data.success ? "You are enrolled. Find this course in My Courses." : data.message || "Enrollment failed");
    } catch {
      setNotice("Unable to connect to server");
    }
  };


  return (

    <div className="course-page">

      {/* Course Header */}

      <div className="course-hero">

        <span className="category-badge">{course.category}</span>

        <h1>
          {course.title}
        </h1>

        <p>
          {course.description}
        </p>


        <div className="course-info">
          <span><strong>Instructor</strong>{course.instructor}</span>
          <span><strong>Duration</strong>{course.duration}</span>
          <span><strong>Price</strong>₹{course.price}</span>
        </div>

        <div className="course-cta-row">
          <button
            className="enroll-main-btn"
            onClick={handleEnroll}
          >
            Enroll Now
          </button>
          <button
            type="button"
            className={`save-toggle-btn ${isFavorite ? "saved" : ""}`}
            onClick={toggleFavorite}
          >
            {isFavorite ? "♥ Saved course" : "♡ Save course"}
          </button>
        </div>

        <div className="rating-panel">
          <div className="rating-summary">
            <span className="course-stars">{Array.from({ length: 5 }, (_, index) => (index < Math.round(averageRating) ? "★" : "☆")).join("")}</span>
            <strong>
              {averageRating ? `${averageRating.toFixed(1)} / 5` : "No ratings yet"}
            </strong>
            <span>{courseRatingValues.length ? `${courseRatingValues.length} reviews` : "Be the first to rate"}</span>
          </div>

          <div className="rating-stars" aria-label="Rate this course">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`rating-star ${userRating >= star ? "active" : ""}`}
                onClick={() => handleRate(star)}
                aria-label={`Rate ${star} out of 5`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {notice && <p className="form-message" role="status">{notice}</p>}

      </div>


      {/* Course Body */}

      <div className="course-body">


        <div className="about-course">

          <h2>
            About this Course
          </h2>

          <p>
            {course.description}
          </p>

        </div>


        <div className="syllabus">

          <h2>
            Course Information
          </h2>


          <div className="module-card">

            <strong>
              Course:
            </strong>{" "}
            {course.title}

          </div>


          <div className="module-card">

            <strong>
              Instructor:
            </strong>{" "}
            {course.instructor}

          </div>


          <div className="module-card">

            <strong>
              Category:
            </strong>{" "}
            {course.category}

          </div>


          <div className="module-card">

            <strong>
              Duration:
            </strong>{" "}
            {course.duration}

          </div>


          <div className="module-card">

            <strong>
              Price:
            </strong>{" "}
            ₹{course.price}

          </div>

        </div>


        <button
          className="enroll-btn"
          onClick={() => navigate("/home")}
        >
          ← Back to Courses
        </button>

      </div>

    </div>
  );
}

export default CourseDetails;