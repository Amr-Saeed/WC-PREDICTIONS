import { flag, methodLabel } from "../data/matches";

export default function MatchCard({ match, prediction, result, onOpen }) {
  const isScored = result && result.homeScore !== "" && result.homeScore !== undefined;

  return (
    <div
      className={"match-card" + (prediction ? " done" : "") + (isScored ? " scored" : "")}
      onClick={() => onOpen(match)}
    >
      <div className="mc-row">
        <div className="mc-team">
          <span className="flag">{flag(match.home)}</span>
          {match.home}
        </div>
        <div className="mc-score">
          {prediction ? prediction.homeScore : isScored ? result.homeScore : "–"}
        </div>
      </div>
      <div className="mc-vs">VS</div>
      <div className="mc-row">
        <div className="mc-team">
          <span className="flag">{flag(match.away)}</span>
          {match.away}
        </div>
        <div className="mc-score">
          {prediction ? prediction.awayScore : isScored ? result.awayScore : "–"}
        </div>
      </div>
      <div className="mc-meta">
        <span>{prediction ? "Your pick: " + methodLabel(prediction.method) : "Tap to predict"}</span>
        {isScored && (
          <span>
            Final{result.method !== "regular" ? " · " + methodLabel(result.method) : ""}
          </span>
        )}
      </div>
    </div>
  );
}
