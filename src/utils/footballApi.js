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

function formatEgyptTime(utcDate) {
  if (!utcDate) return "";

  const date = new Date(utcDate);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatEgyptDateKey(utcDate) {
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

function buildMatchLookup(apiMatches) {
  const lookup = new Map();
  apiMatches.forEach((m) => {
    const home = normalizeName(m.homeTeam?.name || "");
    const away = normalizeName(m.awayTeam?.name || "");
    const key = [home, away].sort().join("__");
    lookup.set(key, m);
  });
  return lookup;
}

function buildMatchTimes(apiMatches) {
  const lookup = buildMatchLookup(apiMatches);
  const kickoffs = {};

  MATCHES.forEach((ourMatch) => {
    const key = [ourMatch.home, ourMatch.away].sort().join("__");
    const apiMatch = lookup.get(key);

    if (!apiMatch || !apiMatch.utcDate) return;

    kickoffs[ourMatch.id] = {
      kickoffUtc: apiMatch.utcDate,
      kickoffEgyptDateKey: formatEgyptDateKey(apiMatch.utcDate),
      kickoffEgypt: formatEgyptTime(apiMatch.utcDate),
      status: apiMatch.status || "",
    };
  });

  return kickoffs;
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

  console.log(
    "[football-data][client] fetched matches:",
    apiMatches.map((match) => ({
      id: match.id,
      status: match.status,
      kickoffUtc: match.utcDate,
      home: match.homeTeam?.name,
      away: match.awayTeam?.name,
    })),
  );

  // Build a quick lookup: "TeamA__TeamB" (order-independent) -> api match
  const lookup = buildMatchLookup(apiMatches);

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

    const duration = apiMatch.score?.duration; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
    const ft = apiMatch.score?.fullTime || {};
    const regularTime = apiMatch.score?.regularTime || null;
    const et = apiMatch.score?.extraTime || {};
    const pens = apiMatch.score?.penalties || {};

    // IMPORTANT: football-data.org's "fullTime" field is only the true
    // 90-minute score for matches that ended in REGULAR time. For matches
    // that went to extra time or penalties, "fullTime" is a combined number
    // (regularTime + penalties) and is NOT the 90-minute scoreline. The real
    // 90-minute score for those matches is in "regularTime". "extraTime" is
    // already the goals scored during the extra-time period itself (not
    // cumulative), so it can be stored directly as our extra_home/extra_away.
    const ninetyMinRaw = regularTime || ft;

    const homeScore = homeIsOurHome ? ninetyMinRaw.home : ninetyMinRaw.away;
    const awayScore = homeIsOurHome ? ninetyMinRaw.away : ninetyMinRaw.home;

    if (homeScore === null || homeScore === undefined) return; // incomplete data

    // Extra-time-only goals (already the per-period count, not cumulative)
    let extraHome = null;
    let extraAway = null;
    if (
      (duration === "EXTRA_TIME" || duration === "PENALTY_SHOOTOUT") &&
      et.home != null &&
      et.away != null
    ) {
      extraHome = homeIsOurHome ? et.home : et.away;
      extraAway = homeIsOurHome ? et.away : et.home;
    }

    // Penalty shootout winner
    let penWinner = null;
    if (
      duration === "PENALTY_SHOOTOUT" &&
      pens.home != null &&
      pens.away != null
    ) {
      const homeWonPens = homeIsOurHome
        ? pens.home > pens.away
        : pens.away > pens.home;
      penWinner = homeWonPens ? "home" : "away";
    }

    results[ourMatch.id] = {
      homeScore,
      awayScore,
      method: mapDuration(duration),
      extraHome,
      extraAway,
      penWinner,
      penHome: pens.home ?? null,
      penAway: pens.away ?? null,
    };
  });

  return { results, unmatched };
}

export async function fetchMatchKickoffs() {
  const res = await fetch("/api/results");

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  const apiMatches = data.matches || [];

  console.log(
    "[football-data][client] kickoff times:",
    buildMatchTimes(apiMatches),
  );

  return buildMatchTimes(apiMatches);
}

export function formatEgyptKickoff(utcDate) {
  return formatEgyptTime(utcDate);
}

export function formatEgyptKickoffDateKey(utcDate) {
  return formatEgyptDateKey(utcDate);
}
