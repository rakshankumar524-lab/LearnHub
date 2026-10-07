import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const defaultNotifications = [
  {
    id: "welcome",
    title: "Welcome to LearnHub",
    message: "Your learning dashboard is ready. Explore a new course today.",
    time: "Just now",
    unread: true,
    type: "info",
  },
  {
    id: "saved",
    title: "Course saved",
    message: "You can revisit your saved courses anytime from your profile.",
    time: "2h ago",
    unread: false,
    type: "success",
  },
  {
    id: "progress",
    title: "Learning reminder",
    message: "A quick lesson streak helps you stay consistent. Keep going!",
    time: "Yesterday",
    unread: true,
    type: "reminder",
  },
];

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("learnhub-notifications") || "null");
      return Array.isArray(saved) && saved.length ? saved : defaultNotifications;
    } catch {
      return defaultNotifications;
    }
  });

  useEffect(() => {
    localStorage.setItem("learnhub-notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications]
  );

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false }))
    );
  };

  const toggleRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: !notification.unread } : notification
      )
    );
  };

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread</p>
        </div>

        <div className="notifications-actions">
          <button className="notifications-mark-btn" onClick={markAllRead}>
            Mark all read
          </button>
          <button className="notifications-back-btn" onClick={() => navigate("/home")}>
            ← Back to Home
          </button>
        </div>
      </header>

      <section className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <h2>No notifications</h2>
            <p>You are all caught up for now.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-item ${notification.unread ? "unread" : "read"}`}
            >
              <div className={`notification-badge ${notification.type}`} aria-hidden="true" />

              <div className="notification-body">
                <div className="notification-topline">
                  <h2>{notification.title}</h2>
                  <span>{notification.time}</span>
                </div>
                <p>{notification.message}</p>
              </div>

              <button
                className="notification-toggle-btn"
                onClick={() => toggleRead(notification.id)}
              >
                {notification.unread ? "Mark read" : "Unread"}
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default Notifications;
