import { flag, methodLabel } from "../data/matches";
import { computePointsBreakdown } from "../utils/scoring";

function formatEgyptLabel(kickoff) {
  if (!kickoff?.kickoffUtc) return "";
  return `${kickoff.kickoffEgypt || ""}`;
}
function isMatchLocked(kickoff) {
  if (!kickoff?.kickoffUtc) return false;
  return new Date() >= new Date(kickoff.kickoffUtc);
}

export default function MatchCard({ match, prediction, result, onOpen }) {
  const isScored =
    result &&
    result.homeScore !== "" &&
    result.homeScore !== undefined &&
    result.homeScore !== null;
  const kickoffLabel = formatEgyptLabel(match.kickoff);
  const locked = isMatchLocked(match.kickoff);

  const { total, breakdown } =
    isScored && prediction
      ? computePointsBreakdown(prediction, result)
      : { total: 0, breakdown: [] };

  return (
    <div
      className={
        "match-card" +
        (prediction ? " done" : "") +
        (isScored ? " scored" : "") +
        (locked ? " locked" : "")
      }
      onClick={() => {
        if (!locked) {
          onOpen(match);
        }
      }}
    >
      <div className="mc-row">
        <div className="mc-team">
          <span className="flag">{flag(match.home)}</span>
          {match.home}
        </div>
        <div className="mc-score">
          {prediction
            ? prediction.homeScore
            : isScored
              ? result.homeScore
              : "–"}
        </div>
      </div>
      <div className="mc-vs">VS</div>
      <div className="mc-row">
        <div className="mc-team">
          <span className="flag">{flag(match.away)}</span>
          {match.away}
        </div>
        <div className="mc-score">
          {prediction
            ? prediction.awayScore
            : isScored
              ? result.awayScore
              : "–"}
        </div>
      </div>
      <div className="mc-meta">
        <span>
          {prediction
            ? "Your pick: " + methodLabel(prediction.method)
            : locked
              ? "Prediction closed"
              : "Tap to predict"}
        </span>
        <span>
          {locked ? "match already started" : "Predict Before Match Starts"}
        </span>
        {isScored && (
          <span>
            Final
            {result.method !== "regular"
              ? " · " + methodLabel(result.method)
              : ""}
          </span>
        )}
      </div>

      {isScored && prediction && (
        <div className="mc-points">
          <span className="mc-points-total">
            {total > 0 ? `+${total} pts` : "0 pts"}
          </span>
          {breakdown.length > 0 && (
            <span className="mc-points-reason">
              {breakdown.map((b) => `${b.label} (+${b.points})`).join(" · ")}
            </span>
          )}
        </div>
      )}

      {kickoffLabel && (
        <div className="mc-kickoff">Kickoff: {kickoffLabel}</div>
      )}
    </div>
  );
}
