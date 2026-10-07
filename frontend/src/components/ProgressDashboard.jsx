import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "../api";

function ProgressDashboard() {
  const navigate = useNavigate();
  const [progressItems, setProgressItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const fetchProgress = async () => {
      try {
        const myCoursesResponse = await fetch(
          `http://localhost:8000/my-courses/${encodeURIComponent(user.email)}`,
          { headers: authHeaders() }
        );
        const myCoursesData = await myCoursesResponse.json();

        if (!myCoursesResponse.ok || !myCoursesData.success) {
          throw new Error(myCoursesData.message || "Unable to load enrolled courses");
        }

        const courses = myCoursesData.enrollments || [];

        const progressRequests = courses.map(async (course) => {
          const response = await fetch(
            `http://localhost:8000/progress/${encodeURIComponent(course.courseName)}`,
            { headers: authHeaders() }
          );
          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load progress");
          }

          return {
            ...course,
            progress: data.progress,
            completedCount: data.completedCount,
            totalLessons: data.totalLessons,
          };
        });

        const resolvedProgress = await Promise.all(progressRequests);
        setProgressItems(resolvedProgress);
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load learning progress");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [navigate]);

  const summary = useMemo(() => {
    const totalCourses = progressItems.length;
    const completedCourses = progressItems.filter((course) => course.progress >= 100).length;
    const averageProgress = totalCourses
      ? Math.round(progressItems.reduce((sum, course) => sum + Number(course.progress || 0), 0) / totalCourses)
      : 0;

    return { totalCourses, completedCourses, averageProgress };
  }, [progressItems]);

  return (
    <div className="progress-page">
      <header className="progress-header">
        <div>
          <h1>Progress Dashboard</h1>
          <p>Track how far you’ve come.</p>
        </div>

        <button className="progress-back-btn" onClick={() => navigate("/home")}>
          ← Back to Home
        </button>
      </header>

      <section className="progress-summary">
        <div className="progress-stat">
          <span>Enrolled courses</span>
          <strong>{summary.totalCourses}</strong>
        </div>
        <div className="progress-stat">
          <span>Completed</span>
          <strong>{summary.completedCourses}</strong>
        </div>
        <div className="progress-stat">
          <span>Average progress</span>
          <strong>{summary.averageProgress}%</strong>
        </div>
      </section>

      <section className="progress-list">
        {error ? (
          <div className="empty-progress" role="alert">
            <h2>Unable to load progress</h2>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <p className="page-state">Loading progress...</p>
        ) : progressItems.length === 0 ? (
          <div className="empty-progress">
            <h2>No active course progress</h2>
            <p>Enroll in a course and begin learning to see your progress here.</p>
          </div>
        ) : (
          progressItems.map((course) => (
            <article className="progress-card" key={course._id || course.courseName}>
              <div className="progress-card-header">
                <h2>{course.courseName}</h2>
                <span className={course.progress >= 100 ? "progress-pill complete" : "progress-pill"}>
                  {course.progress >= 100 ? "Completed" : `${course.progress}%`}
                </span>
              </div>

              <div className="progress-meta">
                <span>{course.completedCount} of {course.totalLessons} lessons</span>
                <span>{new Date(course.enrolledDate).toLocaleDateString()}</span>
              </div>

              <div className="progress-bar-track" aria-label={`${course.courseName} progress`}>
                <div className="progress-bar-fill" style={{ width: `${course.progress}%` }} />
              </div>

              <button
                className="progress-continue-btn"
                onClick={() => navigate(`/lessons/${encodeURIComponent(course.courseName)}`)}
              >
                {course.progress >= 100 ? "Review Course" : "Continue Learning"}
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default ProgressDashboard;
