import SyncResultsButton from "./SyncResultsButton";

export default function LeaderboardView({
  leaderboard,
  currentUserId,
  onSync,
  syncing,
}) {
  console.log("LeaderboardView rendered with leaderboard:", leaderboard);
  return (
    <div>
      <SyncResultsButton onSync={onSync} syncing={syncing} />
      {leaderboard.length === 0 ? (
        <div className="empty-state">
          No players yet. Predictions you make will show up here once others
          join too.
        </div>
      ) : (
        <>
          <div className="legend">
            <span>
              <i style={{ background: "#19c79c" }}></i>1 pt — correct winner
            </span>
            <span>
              <i style={{ background: "#e8c468" }}></i>+1 bonus — correct Extra
              Time call
            </span>
            <span>
              <i style={{ background: "#e5615a" }}></i>+2 bonus — correct
              Penalties call
            </span>
          </div>
          <div className="lb-list">
            {leaderboard.map((u, i) => (
              <div
                key={u.id}
                className={
                  "lb-row" +
                  (i === 0 ? " r1" : i === 1 ? " r2" : i === 2 ? " r3" : "")
                }
              >
                <div className="lb-rank">{i + 1}</div>
                <div className="lb-name">
                  {u.name}
                  {u.id === currentUserId && <span className="you">YOU</span>}
                  <div className="lb-stats">
                    {u.correct}/16 correct · {u.predicted}/16 predicted
                  </div>
                </div>
                <div className="lb-points">{u.total}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
