import { MATCHES } from "../data/matches";
import MatchCard from "./MatchCard";

function egyptDateKeyFromUtc(utcDate) {
  if (!utcDate) return "";
  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function egyptLabelForKey(dateKey, anchorUtc) {
  if (!dateKey) return "";

  const todayKey = egyptDateKeyFromUtc(new Date().toISOString());
  const tomorrowKey = egyptDateKeyFromUtc(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  );

  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";

  const date = new Date(anchorUtc);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function MatchesView({
  predictions,
  results,
  matchKickoffs,
  onOpen,
}) {
  const groupedMatches = MATCHES.reduce((groups, match) => {
    const kickoff = matchKickoffs[match.id];
    const dateKey = kickoff?.kickoffEgyptDateKey || "unknown";
    if (!groups[dateKey]) {
      groups[dateKey] = {
        label: "",
        matches: [],
        anchorUtc: kickoff?.kickoffUtc || "",
      };
    }
    groups[dateKey].matches.push({ ...match, kickoff });
    if (!groups[dateKey].anchorUtc && kickoff?.kickoffUtc) {
      groups[dateKey].anchorUtc = kickoff.kickoffUtc;
    }
    return groups;
  }, {});

  const sortedGroups = Object.entries(groupedMatches)
    .map(([dateKey, group]) => ({
      dateKey,
      label: egyptLabelForKey(dateKey, group.anchorUtc),
      matches: group.matches.sort((a, b) => {
        const aTime = a.kickoff?.kickoffUtc || "";
        const bTime = b.kickoff?.kickoffUtc || "";
        return aTime.localeCompare(bTime);
      }),
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  console.log("sortedGroups:", sortedGroups);

  return (
    <div>
      {sortedGroups.map((group) => (
        <div key={group.dateKey}>
          <div className="group-label">{group.label || group.dateKey}</div>
          <div className="matches-grid">
            {group.matches.map((m) => (
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
