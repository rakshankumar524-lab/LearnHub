import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

function Home() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState(getFavoriteCourseIds);
  const [ratings, setRatings] = useState(getCourseRatings);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    localStorage.setItem("learnhub-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("learnhub-course-ratings", JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    fetch("http://localhost:8000/courses")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load courses");
        setCourses(data.courses);
      })
      .catch((fetchError) => setError(fetchError.message || "Unable to connect to server"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const toggleFavorite = (courseId) => {
    setFavorites((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId]
    );
  };

  const getAverageRating = (courseId) => {
    const courseRatings = Object.values(ratings)
      .filter((value) => typeof value === "number" && value >= 1 && value <= 5);
    const ratingValues = Object.entries(ratings)
      .filter(([id]) => id === courseId)
      .map(([, value]) => Number(value));

    if (!ratingValues.length) {
      return { average: 0, count: 0, stars: "☆☆☆☆☆" };
    }

    const average = ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length;
    const stars = Array.from({ length: 5 }, (_, index) => (index < Math.round(average) ? "★" : "☆")).join("");
    return { average, count: ratingValues.length, stars };
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.category.toLowerCase().includes(search.toLowerCase()) ||
    course.instructor.toLowerCase().includes(search.toLowerCase())
  );

  const displayCourses = showSavedOnly
    ? filteredCourses.filter((course) => favorites.includes(course._id))
    : filteredCourses;

  const savedCount = favorites.length;

  return (
    <div className="dashboard">

      {/* NAVBAR */}
      <nav className="navbar">

        <h2><span className="brand-mark">L</span>LearnHub</h2>

        <div className="nav-right">

          <input
            type="text"
            placeholder="Search courses..."
            className="search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="my-courses-btn"
            onClick={() => navigate("/my-courses")}
          >
            My Courses
          </button>

          <button
            type="button"
            className={`filter-chip ${showSavedOnly ? "active" : ""}`}
            onClick={() => setShowSavedOnly((current) => !current)}
          >
            Saved ({savedCount})
          </button>

          <button
            type="button"
            className="notifications-btn"
            onClick={() => navigate("/notifications")}
          >
            Notifications
          </button>

          <button
            type="button"
            className="settings-btn"
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>

          <button
            type="button"
            className="progress-btn"
            onClick={() => navigate("/progress")}
          >
            Progress
          </button>

          <button
            type="button"
            className="certificates-btn"
            onClick={() => navigate("/certificates")}
          >
            Certificates
          </button>

          <button
            type="button"
            className="leaderboard-btn"
            onClick={() => navigate("/leaderboard")}
          >
            Leaderboard
          </button>

          {/* ADMIN BUTTON */}
          {user && user.role === "admin" && (
            <button
              className="admin-btn"
              onClick={() => navigate("/admin")}
            >
              Admin
            </button>
          )}

          {/* PROFILE */}
          <button
            type="button"
            className="profile profile-button"
            title={user?.email || "User profile"}
            onClick={() => navigate("/profile")}
          >
            <span>{user?.name || "User"}</span>
          </button>

          {/* LOGOUT */}
          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div>
          <h1>Welcome back, {user?.name || "Student"} 👋</h1>
          <p>Continue learning and discover new skills.</p>
        </div>
        <div className="hero-action">
          <div className="hero-stat">
            <strong>{courses.length}</strong>
            <span>courses to explore</span>
          </div>
          <a className="hero-cta" href="#courses">Explore Courses</a>
        </div>
      </section>

      {/* COURSES */}
      <section className="course-section" id="courses">

        <div className="section-header">
          <h2>Explore Courses</h2>
          <p>Learn new skills from our curated courses.</p>
        </div>

        <div className="saved-summary">
          <span>{showSavedOnly ? "Saved courses" : "All courses"}</span>
          <strong>{displayCourses.length} visible</strong>
        </div>

        <div className="course-grid">

          {error ? (
            <div className="no-courses" role="alert">
              <h3>Unable to load courses</h3>
              <p>{error}</p>
            </div>
          ) : loading ? (
            <p className="page-state">Loading courses...</p>
          ) : displayCourses.length === 0 ? (

            <div className="no-courses">
              <h3>{showSavedOnly ? "No Saved Courses Yet" : "No Courses Found"}</h3>
              <p>
                {showSavedOnly
                  ? "Tap the heart icon on any course to save it for later."
                  : "Try searching with a different course name, category, or instructor."}
              </p>
            </div>

          ) : (

            displayCourses.map((course) => {
              const isFavorite = favorites.includes(course._id);
              const rating = getAverageRating(course._id);

              return (
                <div
                  className="course-card"
                  key={course._id}
                >

                  <div className="course-banner">
                    <div className="course-card-header">
                      <h3>{course.title}</h3>
                      <button
                        type="button"
                        className={`save-toggle-btn ${isFavorite ? "saved" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavorite(course._id);
                        }}
                        aria-label={isFavorite ? "Remove from saved courses" : "Save course"}
                      >
                        {isFavorite ? "♥ Saved" : "♡ Save"}
                      </button>
                    </div>
                  </div>

                  <div className="course-content">

                    <span className="category-badge">{course.category}</span>
                    <p className="course-description">{course.description}</p>

                    <div className="course-rating" aria-label={`Course rating: ${rating.average ? rating.average.toFixed(1) : "No ratings yet"}`}>
                      <span className="course-stars">{rating.stars}</span>
                      <span className="course-rating-text">
                        {rating.count ? `${rating.average.toFixed(1)} (${rating.count})` : "No ratings yet"}
                      </span>
                    </div>

                    <p>
                      <strong>Instructor:</strong>{" "}
                      {course.instructor}
                    </p>

                    <p>
                      <strong>Duration:</strong>{" "}
                      {course.duration}
                    </p>

                    <p>
                      <strong>Price:</strong>{" "}
                      ₹{course.price}
                    </p>

                    <button
                      className="enroll-btn"
                      onClick={() =>
                        navigate(`/course/${course._id}`)
                      }
                    >
                      View Course
                    </button>

                  </div>

                </div>
              );
            })

          )}

        </div>

      </section>

    </div>
  );
}

export default Home;