import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/login";
import Register from "./components/register";
import Home from "./components/home";
import CourseDetails from "./components/CourseDetails";
import MyCourses from "./components/MyCourses";
import AdminCourses from "./components/AdminCourses";
import Lessons from "./components/Lessons";
import Profile from "./components/Profile";
import Notifications from "./components/Notifications";
import Settings from "./components/Settings";
import ProgressDashboard from "./components/ProgressDashboard";
import Certificates from "./components/Certificates";
import Leaderboard from "./components/Leaderboard";

function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user && typeof user.email === "string" && typeof user.token === "string" && ["student", "admin"].includes(user.role)
      ? user
      : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function ProtectedRoute({ children }) {
  if (!getStoredUser()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("learnhub-theme");
    return storedTheme || "light";
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("learnhub-theme", theme);
  }, [theme]);

  return (
    <>
      <button
        type="button"
        className="global-theme-toggle"
        onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        aria-label="Toggle color theme"
      >
        {theme === "light" ? "☾ Dark mode" : "☀️ Light mode"}
      </button>

      <BrowserRouter>
        <Routes>

          {/* LOGIN */}
          <Route path="/" element={<Login />} />

          {/* REGISTER */}
          <Route path="/register" element={<Register />} />

          {/* HOME */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* COURSE DETAILS */}
          <Route
            path="/course/:id"
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            }
          />

          {/* MY COURSES */}
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            }
          />

          {/* PROFILE */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* NOTIFICATIONS */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* SETTINGS */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* PROGRESS */}
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <ProgressDashboard />
              </ProtectedRoute>
            }
          />

          {/* CERTIFICATES */}
          <Route
            path="/certificates"
            element={
              <ProtectedRoute>
                <Certificates />
              </ProtectedRoute>
            }
          />

          {/* LEADERBOARD */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          {/* LESSONS */}
          <Route
            path="/lessons/:courseName"
            element={
              <ProtectedRoute>
                <Lessons />
              </ProtectedRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminCourses />
              </AdminRoute>
            }
          />

          {/* UNKNOWN URL */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;