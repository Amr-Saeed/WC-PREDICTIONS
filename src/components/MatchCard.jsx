import { flag, methodLabel } from "../data/matches";

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
    result && result.homeScore !== "" && result.homeScore !== undefined;
  const kickoffLabel = formatEgyptLabel(match.kickoff);
  const locked = isMatchLocked(match.kickoff);
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
        {isScored && (
          <span>
            Final
            {result.method !== "regular"
              ? " · " + methodLabel(result.method)
              : ""}
          </span>
        )}
      </div>
      {kickoffLabel && (
        <div className="mc-kickoff">Kickoff: {kickoffLabel}</div>
      )}
    </div>
  );
}
