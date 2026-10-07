import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const savedCourses = JSON.parse(localStorage.getItem("learnhub-favorites") || "[]");
  const ratingMap = JSON.parse(localStorage.getItem("learnhub-course-ratings") || "{}");
  const ratingCount = Object.values(ratingMap).filter((value) => Number(value) >= 1 && Number(value) <= 5).length;
  const totalCompleted = savedCourses.length + ratingCount;

  if (!user) {
    return null;
  }

  const roleLabel = user.role === "admin" ? "Administrator" : "Student";
  const learningTier = savedCourses.length >= 5 ? "Learning Explorer" : savedCourses.length >= 2 ? "Course Enthusiast" : "New Learner";

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <h1>My Profile</h1>
          <p>Track your learning journey.</p>
        </div>

        <button
          className="profile-back-btn"
          onClick={() => navigate("/home")}
        >
          ← Back to Home
        </button>
      </header>

      <section className="profile-card">
        <div className="profile-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>

        <div className="profile-main">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="profile-role-badge">{roleLabel}</span>
        </div>
      </section>

      <section className="profile-stats">
        <div className="profile-stat">
          <span>Saved Courses</span>
          <strong>{savedCourses.length}</strong>
        </div>
        <div className="profile-stat">
          <span>Ratings Given</span>
          <strong>{ratingCount}</strong>
        </div>
        <div className="profile-stat">
          <span>Learning Tier</span>
          <strong>{learningTier}</strong>
        </div>
        <div className="profile-stat">
          <span>Activity Score</span>
          <strong>{totalCompleted}</strong>
        </div>
      </section>

      <section className="profile-details">
        <div className="profile-panel">
          <h3>About</h3>
          <p>
            {user.role === "admin"
              ? "You manage the catalog, lessons, and learning content on LearnHub."
              : "You are building momentum through your saved courses and course progress journey."}
          </p>
        </div>

        <div className="profile-panel">
          <h3>Quick Summary</h3>
          <ul>
            <li>Role: {roleLabel}</li>
            <li>Saved learning plan: {savedCourses.length} courses</li>
            <li>Current focus: {learningTier}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Profile;
