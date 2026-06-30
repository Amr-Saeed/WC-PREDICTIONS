import { useState } from "react";
import { flag } from "../data/matches";
import { METHODS } from "../data/matches";

export default function MatchModal({
  match,
  prediction,
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
  const [method, setMethod] = useState(prediction?.method || "regular");
  const [extraHome, setExtraHome] = useState(
    prediction?.extraHome != null ? String(prediction.extraHome) : "",
  );
  const [extraAway, setExtraAway] = useState(
    prediction?.extraAway != null ? String(prediction.extraAway) : "",
  );
  const [penWinner, setPenWinner] = useState(prediction?.penWinner || "");
  const [penHome, setPenHome] = useState(
    prediction?.penHome != null ? String(prediction.penHome) : "",
  );
  const [penAway, setPenAway] = useState(
    prediction?.penAway != null ? String(prediction.penAway) : "",
  );

  const homeNum = home === "" ? null : Number(home);
  const awayNum = away === "" ? null : Number(away);
  const validRegulation =
    homeNum !== null &&
    awayNum !== null &&
    !Number.isNaN(homeNum) &&
    !Number.isNaN(awayNum);
  const isDraw = validRegulation && homeNum === awayNum;

  const extraHomeNum = extraHome === "" ? null : Number(extraHome);
  const extraAwayNum = extraAway === "" ? null : Number(extraAway);
  const validExtra =
    extraHomeNum !== null &&
    extraAwayNum !== null &&
    !Number.isNaN(extraHomeNum) &&
    !Number.isNaN(extraAwayNum);
  const extraIsTied = validExtra && extraHomeNum === extraAwayNum;

  // Auto-correct the selected method whenever the scoreline changes:
  // a decisive score always forces "regular"; a draw can never stay "regular".
  const effectiveMethod = !validRegulation
    ? "regular"
    : isDraw
      ? method === "regular"
        ? ""
        : method
      : "regular";

  const selectMethod = (key) => {
    if (!isDraw) return; // chips are inert until the score is actually a draw
    setMethod(key);
  };

  let canSave = false;
  if (validRegulation && !isDraw) {
    canSave = true;
  } else if (validRegulation && isDraw && effectiveMethod === "extra_time") {
    canSave = validExtra && !extraIsTied;
  } else if (validRegulation && isDraw && effectiveMethod === "penalties") {
    canSave = penWinner === "home" || penWinner === "away";
  }

  const submit = () => {
    if (!canSave) return;
    const finalMethod = !isDraw ? "regular" : effectiveMethod;

    onSave({
      homeScore: homeNum,
      awayScore: awayNum,
      method: finalMethod,
      extraHome: finalMethod === "extra_time" ? extraHomeNum : null,
      extraAway: finalMethod === "extra_time" ? extraAwayNum : null,
      penWinner: finalMethod === "penalties" ? penWinner : null,
      penHome:
        finalMethod === "penalties" && penHome !== "" ? Number(penHome) : null,
      penAway:
        finalMethod === "penalties" && penAway !== "" ? Number(penAway) : null,
    });
    onClose();
  };

  const finalScorePreview =
    effectiveMethod === "extra_time" && validExtra
      ? `${homeNum + extraHomeNum} - ${awayNum + extraAwayNum}`
      : null;

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
          <div
            className={
              "method-chip" +
              (!isDraw ? " sel" : "") +
              (isDraw ? " disabled" : "")
            }
          >
            Regular Time
            <span className="pts">+3 pts</span>
          </div>
          <div
            className={
              "method-chip" +
              (effectiveMethod === "extra_time" ? " sel" : "") +
              (!isDraw ? " disabled" : "")
            }
            onClick={() => selectMethod("extra_time")}
          >
            Extra Time
            <span className="pts">+1 pts</span>
          </div>
          <div
            className={
              "method-chip" +
              (effectiveMethod === "penalties" ? " sel" : "") +
              (!isDraw ? " disabled" : "")
            }
            onClick={() => selectMethod("penalties")}
          >
            Penalties
            <span className="pts">+2 pts</span>
          </div>
        </div>

        {isDraw && !effectiveMethod && (
          <div className="winner-note" style={{ color: "#e5615a" }}>
            The match is currently predicted to end in a draw after 90 minutes.
            Please choose Extra Time or Penalties.
          </div>
        )}

        {effectiveMethod === "extra_time" && (
          <>
            <div className="field-label">Extra Time Goals</div>
            <div className="winner-note">
              Enter only the goals scored during extra time, not the final
              score.
            </div>
            <div className="teams-row" style={{ marginTop: 10 }}>
              <div className="team-col">
                <span className="name">{match.home}</span>
              </div>
              <input
                className="score-input"
                type="number"
                min="0"
                max="10"
                value={extraHome}
                onChange={(e) => setExtraHome(e.target.value)}
              />
              <span className="vs-divider">VS</span>
              <input
                className="score-input"
                type="number"
                min="0"
                max="10"
                value={extraAway}
                onChange={(e) => setExtraAway(e.target.value)}
              />
              <div className="team-col">
                <span className="name">{match.away}</span>
              </div>
            </div>

            {extraIsTied && (
              <div className="winner-note" style={{ color: "#e5615a" }}>
                The match is still tied after extra time — enter a result with a
                winner, or switch to Penalties above.
              </div>
            )}

            {finalScorePreview && !extraIsTied && (
              <div className="winner-note">
                90 Minutes:{" "}
                <b>
                  {home} - {away}
                </b>
                <br />
                Extra Time:{" "}
                <b>
                  {extraHome} - {extraAway}
                </b>
                <br />
                Winner: <b>{extraHome > extraAway ? match.home : match.away}</b>
                <br />
                Final Match Result: <b>{finalScorePreview}</b>
              </div>
            )}
          </>
        )}

        {effectiveMethod === "penalties" && (
          <>
            <div className="field-label">Who wins on penalties?</div>
            <div className="method-options">
              <div
                className={"method-chip" + (penWinner === "home" ? " sel" : "")}
                onClick={() => setPenWinner("home")}
              >
                {match.home}
              </div>
              <div
                className={"method-chip" + (penWinner === "away" ? " sel" : "")}
                onClick={() => setPenWinner("away")}
              >
                {match.away}
              </div>
            </div>

            {penWinner && (
              <div className="winner-note">
                Winner after penalties:{" "}
                <b>{penWinner === "home" ? match.home : match.away}</b>
              </div>
            )}

            <div className="field-label">
              Predicted penalty score (optional)
            </div>
            <div className="teams-row" style={{ marginTop: 10 }}>
              <div className="team-col">
                <span className="name">{match.home}</span>
              </div>
              <input
                className="score-input"
                type="number"
                min="0"
                max="20"
                value={penHome}
                onChange={(e) => setPenHome(e.target.value)}
              />
              <span className="vs-divider">VS</span>
              <input
                className="score-input"
                type="number"
                min="0"
                max="20"
                value={penAway}
                onChange={(e) => setPenAway(e.target.value)}
              />
              <div className="team-col">
                <span className="name">{match.away}</span>
              </div>
            </div>
          </>
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
