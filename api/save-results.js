import { createClient } from "@supabase/supabase-js";

function normalizePayload(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error:
        "Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY on the server.",
    });
  }

  const payload = normalizePayload(req.body);
  const results = payload.results || {};
  const rows = Object.entries(results).map(([matchId, result]) => ({
    match_id: matchId,
    home_score: result.homeScore,
    away_score: result.awayScore,
    method: result.method || "regular",
    extra_home: result.extraHome ?? null,
    extra_away: result.extraAway ?? null,
    pen_winner: result.penWinner ?? null,
    pen_home: result.penHome ?? null,
    pen_away: result.penAway ?? null,
    first_goal_team: result.firstGoalTeam ?? null,
    first_goal_player: result.firstGoalPlayer ?? null,
  }));

  if (rows.length === 0) {
    return res.status(200).json({ results: {}, count: 0 });
  }

  const client = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await client
    .from("results")
    .upsert(rows, { onConflict: "match_id" })
    .select(
      "match_id, home_score, away_score, method, extra_home, extra_away, pen_winner, pen_home, pen_away, first_goal_team, first_goal_player",
    );
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const savedResults = (data || []).reduce((acc, row) => {
    acc[row.match_id] = {
      homeScore: row.home_score,
      awayScore: row.away_score,
      method: row.method,
      extraHome: row.extra_home,
      extraAway: row.extra_away,
      penWinner: row.pen_winner,
      penHome: row.pen_home,
      penAway: row.pen_away,
      firstGoalTeam: row.first_goal_team,
      firstGoalPlayer: row.first_goal_player,
    };
    return acc;
  }, {});

  return res.status(200).json({ results: savedResults, count: rows.length });
}
