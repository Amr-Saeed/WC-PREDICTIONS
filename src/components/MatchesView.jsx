import { MATCHES } from "../data/matches";
import MatchCard from "./MatchCard";

const GROUPS = ["Left Bracket", "Right Bracket"];

export default function MatchesView({ predictions, results, onOpen }) {
  return (
    <div>
      {GROUPS.map((group) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          <div className="matches-grid">
            {MATCHES.filter((m) => m.group === group).map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                prediction={predictions[m.id]}
                result={results[m.id]}
                onOpen={onOpen}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
