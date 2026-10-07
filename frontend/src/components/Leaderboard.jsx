import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const defaultLeaderboard = [
  { name: "Maya Chen", score: 980, completed: 8, streak: 14 },
  { name: "Aarav Patel", score: 940, completed: 7, streak: 11 },
  { name: "Noah Garcia", score: 905, completed: 6, streak: 10 },
  { name: "Priya Shah", score: 860, completed: 6, streak: 9 },
  { name: "Leo Martin", score: 815, completed: 5, streak: 7 },
];

function getStoredUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user && typeof user.name === "string" ? user : null;
  } catch {
    return null;
  }
}

function getLeaderboardSeed() {
  try {
    const stored = JSON.parse(localStorage.getItem("learnhub-leaderboard") || "null");
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {
    // fall through to defaults
  }
  return defaultLeaderboard;
}

function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const seeded = getLeaderboardSeed();
    const userScore = Number(localStorage.getItem("learnhub-user-score") || "0");
    const userEntry = {
      name: user.name,
      score: userScore > 0 ? userScore : 760,
      completed: Math.max(4, Math.round((userScore || 760) / 115)),
      streak: 8,
    };

    const merged = [...seeded.filter((entry) => entry.name !== user.name), userEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    localStorage.setItem("learnhub-leaderboard", JSON.stringify(merged));
    setLeaderboard(merged);
  }, [navigate]);

  const currentUser = getStoredUser();

  const userRank = useMemo(() => {
    if (!currentUser) return null;
    return leaderboard.findIndex((entry) => entry.name === currentUser.name) + 1;
  }, [currentUser, leaderboard]);

  const currentEntry = leaderboard.find((entry) => entry.name === currentUser?.name);

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <div>
          <h1>Learning Leaderboard</h1>
          <p>See who is climbing the ranks this week.</p>
        </div>

        <button className="leaderboard-home-btn" onClick={() => navigate("/home")}>
          ← Back to Home
        </button>
      </header>

      <section className="leaderboard-summary">
        <div className="leaderboard-stat">
          <span>Your rank</span>
          <strong>#{userRank || "—"}</strong>
        </div>
        <div className="leaderboard-stat">
          <span>Learning score</span>
          <strong>{currentEntry?.score || 0}</strong>
        </div>
        <div className="leaderboard-stat">
          <span>Completed courses</span>
          <strong>{currentEntry?.completed || 0}</strong>
        </div>
      </section>

      <section className="leaderboard-list">
        {leaderboard.map((entry) => (
          <article
            key={`${entry.name}-${entry.score}`}
            className={`leaderboard-card ${currentUser?.name === entry.name ? "is-current-user" : ""}`}
          >
            <div className="leaderboard-rank">#{entry.rank}</div>

            <div className="leaderboard-main">
              <div className="leaderboard-name-row">
                <h2>{entry.name}</h2>
                {entry.rank === 1 && <span className="leaderboard-medal gold">Gold</span>}
                {entry.rank === 2 && <span className="leaderboard-medal silver">Silver</span>}
                {entry.rank === 3 && <span className="leaderboard-medal bronze">Bronze</span>}
              </div>

              <div className="leaderboard-meta">
                <span>{entry.completed} courses</span>
                <span>{entry.streak}-week streak</span>
              </div>
            </div>

            <div className="leaderboard-score">{entry.score}</div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Leaderboard;
