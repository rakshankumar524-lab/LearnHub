import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const stored = JSON.parse(localStorage.getItem("learnhub-settings") || "{}");
    if (stored.notificationsEnabled !== undefined) setNotificationsEnabled(stored.notificationsEnabled);
    if (stored.emailUpdates !== undefined) setEmailUpdates(stored.emailUpdates);
    if (stored.weeklyDigest !== undefined) setWeeklyDigest(stored.weeklyDigest);
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem(
      "learnhub-settings",
      JSON.stringify({ notificationsEnabled, emailUpdates, weeklyDigest })
    );
  }, [notificationsEnabled, emailUpdates, weeklyDigest]);

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Customize your LearnHub experience.</p>
        </div>

        <button className="settings-back-btn" onClick={() => navigate("/home")}>
          ← Back to Home
        </button>
      </header>

      <section className="settings-card">
        <div className="setting-row">
          <div>
            <h2>Push notifications</h2>
            <p>Receive updates on new lessons and course alerts.</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(event) => setNotificationsEnabled(event.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="setting-row">
          <div>
            <h2>Email updates</h2>
            <p>Get weekly course reminders and account updates.</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={emailUpdates}
              onChange={(event) => setEmailUpdates(event.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="setting-row">
          <div>
            <h2>Weekly digest</h2>
            <p>Receive a summary of your saved courses and progress each week.</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(event) => setWeeklyDigest(event.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </section>
    </div>
  );
}

export default Settings;
