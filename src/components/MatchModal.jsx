import { useState } from "react";
import { flag, methodLabel, METHODS } from "../data/matches";

export default function MatchModal({
  match,
  prediction,
  result,
  onClose,
  onSave,
  onClear,
}) {
  const [home, setHome] = useState(
    prediction ? String(prediction.homeScore) : "",
  );
  const [away, setAway] = useState(
    prediction ? String(prediction.awayScore) : "",
  );
  const [method, setMethod] = useState(
    prediction ? prediction.method : "regular",
  );

  const isDraw = home !== "" && away !== "" && Number(home) === Number(away);
  const canSave =
    home !== "" &&
    away !== "" &&
    !Number.isNaN(Number(home)) &&
    !Number.isNaN(Number(away)) &&
    (!isDraw || method !== "regular");

  const submit = () => {
    if (!canSave) return;
    onSave({ homeScore: Number(home), awayScore: Number(away), method });
    onClose();
  };

  const winnerName = (() => {
    if (home === "" || away === "") return null;
    const h = Number(home);
    const a = Number(away);
    if (Number.isNaN(h) || Number.isNaN(a)) return null;
    if (h > a) return match.home;
    if (a > h) return match.away;
    return null;
  })();

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Your Prediction</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="teams-row">
          <div className="team-col">
            <span className="flag">{flag(match.home)}</span>
            <span className="name">{match.home}</span>
          </div>
          <input
            className="score-input"
            type="number"
            min="0"
            max="20"
            value={home}
            onChange={(e) => setHome(e.target.value)}
          />
          <span className="vs-divider">VS</span>
          <input
            className="score-input"
            type="number"
            min="0"
            max="20"
            value={away}
            onChange={(e) => setAway(e.target.value)}
          />
          <div className="team-col">
            <span className="flag">{flag(match.away)}</span>
            <span className="name">{match.away}</span>
          </div>
        </div>

        <div className="field-label">How does the winner advance?</div>
        <div className="method-options">
          {METHODS.map((m) => (
            <div
              key={m.key}
              className={"method-chip" + (method === m.key ? " sel" : "")}
              onClick={() => setMethod(m.key)}
            >
              {m.label}
              <span className="pts">{m.pts}</span>
            </div>
          ))}
        </div>

        {winnerName && (
          <div className="winner-note">
            You're picking <b>{winnerName}</b> to win{" "}
            {method !== "regular"
              ? "in " + methodLabel(method).toLowerCase()
              : "in regular time"}
            .
          </div>
        )}
        {isDraw && method === "regular" && (
          <div className="winner-note" style={{ color: "#e5615a" }}>
            Scores are level — choose Extra Time or Penalties to set a winner.
          </div>
        )}

        <button className="save-btn" disabled={!canSave} onClick={submit}>
          Save Prediction
        </button>
        {prediction && (
          <button
            className="clear-btn"
            onClick={() => {
              onClear();
              onClose();
            }}
          >
            Clear my prediction
          </button>
        )}
      </div>
    </div>
  );
}
