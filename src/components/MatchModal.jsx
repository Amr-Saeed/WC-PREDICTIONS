import { useState } from "react";
import { flag, methodLabel, METHODS } from "../data/matches";

export default function MatchModal({ match, prediction, result, onClose, onSave, onClear, onSaveResult }) {
  const [home, setHome] = useState(prediction ? String(prediction.homeScore) : "");
  const [away, setAway] = useState(prediction ? String(prediction.awayScore) : "");
  const [method, setMethod] = useState(prediction ? prediction.method : "regular");

  const [adminOpen, setAdminOpen] = useState(false);
  const [rHome, setRHome] = useState(result ? String(result.homeScore) : "");
  const [rAway, setRAway] = useState(result ? String(result.awayScore) : "");
  const [rMethod, setRMethod] = useState(result ? result.method : "regular");

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

  const submitResult = () => {
    if (rHome === "" || rAway === "") return;
    onSaveResult({ homeScore: Number(rHome), awayScore: Number(rAway), method: rMethod });
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
            {method !== "regular" ? "in " + methodLabel(method).toLowerCase() : "in regular time"}.
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

        <div className="admin-toggle" onClick={() => setAdminOpen((o) => !o)}>
          {adminOpen ? "Hide actual result entry" : "Enter actual match result (admin)"}
        </div>

        {adminOpen && (
          <div className="admin-box">
            <div className="field-label">Actual Final Score</div>
            <div className="teams-row" style={{ marginBottom: 8 }}>
              <div className="team-col">
                <span className="name">{match.home}</span>
              </div>
              <input
                className="score-input"
                type="number"
                min="0"
                max="20"
                value={rHome}
                onChange={(e) => setRHome(e.target.value)}
              />
              <span className="vs-divider">VS</span>
              <input
                className="score-input"
                type="number"
                min="0"
                max="20"
                value={rAway}
                onChange={(e) => setRAway(e.target.value)}
              />
              <div className="team-col">
                <span className="name">{match.away}</span>
              </div>
            </div>
            <div className="field-label">Decided by</div>
            <div className="method-options">
              {METHODS.map((m) => (
                <div
                  key={m.key}
                  className={"method-chip" + (rMethod === m.key ? " sel" : "")}
                  onClick={() => setRMethod(m.key)}
                >
                  {m.label}
                </div>
              ))}
            </div>
            <button
              className="save-btn"
              style={{ background: "linear-gradient(135deg,#e8c468,#b9913a)" }}
              onClick={submitResult}
            >
              Save Actual Result
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
