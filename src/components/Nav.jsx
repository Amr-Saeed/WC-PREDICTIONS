export default function Nav({ view, setView }) {
  return (
    <div className="nav">
      <button className={view === "matches" ? "active" : ""} onClick={() => setView("matches")}>
        ⚽ Matches
      </button>
      <button className={view === "leaderboard" ? "active" : ""} onClick={() => setView("leaderboard")}>
        🏅 Leaderboard
      </button>
    </div>
  );
}
