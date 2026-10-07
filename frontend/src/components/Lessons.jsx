import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authHeaders } from "../api";

function Lessons() {
  const { courseName } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [savingLesson, setSavingLesson] = useState("");

  useEffect(() => {
    let active = true;
    const user = JSON.parse(localStorage.getItem("user") || "null");

    fetch(
      `http://localhost:8000/lessons/${encodeURIComponent(courseName)}`
      , { headers: authHeaders() }
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load lessons");
        if (active) setLessons(data.lessons);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message || "Unable to connect to server");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (user?.role === "student") {
      fetch(`http://localhost:8000/progress/${encodeURIComponent(courseName)}`, { headers: authHeaders() })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.message || "Unable to load course progress");
          if (active) setProgress(data);
        })
        .catch((fetchError) => {
          if (active) setProgressError(fetchError.message || "Unable to load course progress");
        });
    }

    return () => { active = false; };
  }, [courseName]);

  const handleMarkComplete = async (lessonId) => {
    setSavingLesson(lessonId);
    setProgressError("");

    try {
      const response = await fetch("http://localhost:8000/progress/complete", {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ courseName, lessonId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update course progress");
      setProgress(data);
    } catch (progressFetchError) {
      setProgressError(progressFetchError.message || "Unable to update course progress");
    } finally {
      setSavingLesson("");
    }
  };

  const completedLessonIds = new Set(progress?.completedLessons || []);

  return (
    <div className="lessons-page">

      <div className="lessons-header">
        <h1>{courseName}</h1>
        <p>Course Lessons</p>

        <button
          className="lessons-home-btn"
          onClick={() => navigate("/my-courses")}
        >
          ← Back to My Courses
        </button>
      </div>

      <div className="lessons-container">

        {progress && (
          <section className="lesson-progress-summary" aria-label="Course progress">
            <div className="lesson-progress-heading">
              <strong>Progress</strong>
              <span>{progress.progress}%</span>
            </div>
            <progress aria-label={`${courseName} progress`} max="100" value={progress.progress} />
            <p>{progress.completedCount} of {progress.totalLessons} lessons completed</p>
            {progress.progress === 100 && <strong className="lesson-complete-message">Course Completed 🎉</strong>}
          </section>
        )}

        {progressError && <p className="form-message error-message" role="alert">{progressError}</p>}

        {error ? (
          <div className="empty-lessons" role="alert"><h2>Unable to load lessons</h2><p>{error}</p></div>
        ) : loading ? (
          <p className="page-state">Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <div className="empty-lessons">
            <h2>No Lessons Available</h2>
            <p>Lessons for this course have not been added yet.</p>
          </div>
        ) : (
          <div className="lesson-list">

            {lessons.map((lesson, index) => (
              <div
                className="lesson-card"
                key={lesson._id}
              >
                <div className="lesson-number">
                  {index + 1}
                </div>

                <div className="lesson-content">
                  <h2>{lesson.title}</h2>

                  <p>{lesson.description}</p>

                  {lesson.videoUrl && (
                    <a
                      href={lesson.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="lesson-video-btn"
                    >
                      Watch Lesson
                    </a>
                  )}

                  {progress && (completedLessonIds.has(lesson._id) ? (
                    <span className="lesson-complete-message">✓ Completed</span>
                  ) : (
                    <button
                      className="continue-btn lesson-completion-button"
                      type="button"
                      onClick={() => handleMarkComplete(lesson._id)}
                      disabled={savingLesson === lesson._id}
                    >
                      {savingLesson === lesson._id ? "Saving..." : "Mark as Complete"}
                    </button>
                  ))}
                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default Lessons;