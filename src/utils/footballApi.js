// Pulls real World Cup match results from football-data.org (free tier),
// via a small serverless proxy at /api/results.
//
// Why a proxy? football-data.org's CORS setup does not reliably allow
// direct browser calls (you may see a CORS error pointing at a mismatched
// Access-Control-Allow-Origin header). Server-to-server requests aren't
// subject to CORS, so this app calls its OWN backend endpoint
// (api/results.js, a Vercel serverless function), and that function makes
// the real call to football-data.org using a token that stays server-side.
//
// Local dev setup:
// 1. Create a .env file at the project root with:
//      FOOTBALL_DATA_TOKEN=your_token_here
//    (get a free token at https://www.football-data.org/client/register)
// 2. Run `npm run dev`. Vite serves /api/results locally using the same token.
//
// Production (Vercel) setup:
// 1. Deploy this project to Vercel (vercel.com -> Import Project).
// 2. In Project Settings -> Environment Variables, add:
//      FOOTBALL_DATA_TOKEN = your_token_here
// 3. Redeploy. /api/results will work automatically.

import { MATCHES } from "../data/matches";

// football-data.org sometimes uses slightly different team names than ours.
// Map any mismatches here: { "API name": "Our name in matches.js" }
const NAME_ALIASES = {
  "Korea Republic": "South Korea",
  USA: "United States",
  "Bosnia and Herzegovina": "Bosnia-Herzegovina",
  "Ivory Coast": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "DR Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "Cape Verde Islands": "Cape Verde",
};

function normalizeName(apiName) {
  return NAME_ALIASES[apiName] || apiName;
}

// Converts football-data.org's "duration" field into our method keys.
function mapDuration(duration) {
  if (duration === "EXTRA_TIME") return "extra_time";
  if (duration === "PENALTY_SHOOTOUT") return "penalties";
  return "regular"; // REGULAR or anything else
}

// Fetches all matches for the competition and returns only the finished ones,
// matched up against our local MATCHES list by team names.
//
// Returns: { matchId: { homeScore, awayScore, method } }
// Throws on network/auth errors so the caller can show a message.
export async function fetchRealResults() {
  const res = await fetch("/api/results");

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON from /api/results but received ${contentType || "an unknown content type"}. ${text.slice(0, 120)}`,
    );
  }

  const data = await res.json();
  const apiMatches = data.matches || [];

  // Build a quick lookup: "TeamA__TeamB" (order-independent) -> api match
  const lookup = new Map();
  apiMatches.forEach((m) => {
    const home = normalizeName(m.homeTeam?.name || "");
    const away = normalizeName(m.awayTeam?.name || "");
    const key = [home, away].sort().join("__");
    lookup.set(key, m);
  });

  const results = {};
  const unmatched = [];

  MATCHES.forEach((ourMatch) => {
    const key = [ourMatch.home, ourMatch.away].sort().join("__");
    const apiMatch = lookup.get(key);

    if (!apiMatch) {
      unmatched.push(ourMatch);
      return;
    }

    if (apiMatch.status !== "FINISHED") return; // not played yet, skip

    const homeIsOurHome =
      normalizeName(apiMatch.homeTeam?.name) === ourMatch.home;
    const ft = apiMatch.score?.fullTime || {};
    const et = apiMatch.score?.extraTime || {};
    const pens = apiMatch.score?.penalties || {};
    const duration = apiMatch.score?.duration; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT

    // Use extra time score if it happened, otherwise full time score.
    // (Penalty shootout score isn't a "scoreline" for our purposes — the
    // match score stays whatever it was after extra time.)
    const homeRaw = et.home ?? ft.home;
    const awayRaw = et.away ?? ft.away;

    if (homeRaw === null || homeRaw === undefined) return; // incomplete data

    const homeScore = homeIsOurHome ? homeRaw : awayRaw;
    const awayScore = homeIsOurHome ? awayRaw : homeRaw;

    results[ourMatch.id] = {
      homeScore,
      awayScore,
      method: mapDuration(duration),
    };
  });

  return { results, unmatched };
}
