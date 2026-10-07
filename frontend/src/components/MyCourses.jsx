import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "../api";

function MyCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    fetch(`http://localhost:8000/my-courses/${encodeURIComponent(user.email)}`, { headers: authHeaders() })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load your courses");
        setCourses(data.enrollments);
      })
      .catch((fetchError) => setError(fetchError.message || "Unable to connect to server"))
      .finally(() => setLoading(false));
  }, [navigate]);

const handleContinue = (courseName) => {
  navigate(
    `/lessons/${encodeURIComponent(courseName)}`
  );
};

  return (
    <div className="my-courses-page">

      {/* HEADER */}
      <div className="my-courses-header">
        <h1>My Courses</h1>

        <p>
          Continue your learning journey.
        </p>

        <button
          className="my-courses-home-btn"
          onClick={() => navigate("/home")}
        >
          ← Back to Home
        </button>
      </div>

      {/* COURSES */}
      <div className="my-courses-container">

        {error ? (
          <div className="empty-courses" role="alert"><h2>Unable to load courses</h2><p>{error}</p></div>
        ) : loading ? (
          <p className="page-state">Loading your courses...</p>
        ) : courses.length === 0 ? (
          <div className="empty-courses">

            <h2>No Courses Yet</h2>

            <p>
              Browse our courses and start learning.
            </p>

            <button
              className="continue-btn"
              onClick={() => navigate("/home")}
            >
              Browse Courses
            </button>

          </div>
        ) : (

          <div className="my-course-grid">

            {courses.map((course) => (

              <div
                className="my-course-card"
                key={course._id}
              >

                {/* COURSE BANNER */}
                <div className="my-course-banner">
                  <h2>{course.courseName}</h2>
                </div>

                {/* COURSE DETAILS */}
                <div className="my-course-content">

                  <p>
                      <strong>Student:</strong>{" "}
                      {course.studentName}
                    </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {course.email}
                  </p>

                  <p>
                    <strong>Enrolled:</strong>{" "}
                    {new Date(
                      course.enrolledDate
                    ).toLocaleDateString()}
                  </p>

                  <button
  className="continue-btn"
  onClick={() => handleContinue(course.courseName)}
>
  Continue Learning
</button>
                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default MyCourses;