import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function requireClient() {
  if (!supabase) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export async function signInWithEmail(email, displayName, password) {
  const client = requireClient();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if display name is already taken by a different email
  const { data: existingProfile } = await client
    .from("profiles")
    .select("id, email, display_name")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  // Try signing in first (returning user)
  const { data: signInData } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInData?.user) {
    // Returning user — do NOT overwrite their display_name
    const profile = await getProfile(signInData.user.id);
    return {
      user: signInData.user,
      message: `Logged in as ${profile?.display_name || displayName}`,
    };
  }

  // Sign in failed — check if email exists with a different password
  if (existingProfile?.id) {
    throw new Error("Incorrect password for this email address.");
  }

  // New user — check display name uniqueness first
  const { data: nameTaken } = await client
    .from("profiles")
    .select("id")
    .ilike("display_name", displayName.trim())
    .maybeSingle();

  if (nameTaken) {
    throw new Error(
      "This display name is already taken. Please choose a different name.",
    );
  }

  // Create new account
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { display_name: displayName.trim(), email: normalizedEmail },
    },
  });

  if (signUpError) throw signUpError;

  if (signUpData?.user) {
    const { data: signInAfterSignUp, error: signInAfterSignUpError } =
      await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (signInAfterSignUpError) throw signInAfterSignUpError;

    if (signInAfterSignUp?.user) {
      await upsertProfile(
        signInAfterSignUp.user.id,
        displayName.trim(),
        normalizedEmail,
      );
      return {
        user: signInAfterSignUp.user,
        message: `Logged in as ${displayName.trim()}`,
      };
    }
  }

  throw new Error("Unable to log in. Please try again.");
}

export async function getCurrentUser() {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

export async function signOut() {
  const client = requireClient();
  // 🆕 Unsubscribe from notifications on logout
  try {
    const { unsubscribeFromPush } =
      await import("../../api/notificationService.js");
    await unsubscribeFromPush();
  } catch (err) {
    console.warn("Error unsubscribing from notifications:", err);
  }
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, email, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProfile(userId, displayName, email) {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .upsert(
      { id: userId, display_name: displayName, email },
      { onConflict: "id" },
    )
    .select("id, email, display_name")
    .single();

  if (error) throw error;
  return data;
}

export async function listProfiles() {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, email, display_name")
    .order("display_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPredictions(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from("predictions")
    .select(
      "match_id, home_score, away_score, method, extra_home, extra_away, pen_winner, pen_home, pen_away, first_goal_team, first_goal_player",
    )
    .eq("user_id", userId);

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
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
}

export async function savePrediction(userId, matchId, prediction) {
  const client = requireClient();

  let winner = null;

  if (prediction.homeScore > prediction.awayScore) {
    winner = "home";
  } else if (prediction.homeScore < prediction.awayScore) {
    winner = "away";
  } else if (prediction.method === "extra_time") {
    if (prediction.extraHome > prediction.extraAway) {
      winner = "home";
    } else if (prediction.extraAway > prediction.extraHome) {
      winner = "away";
    }
  } else if (prediction.method === "penalties") {
    winner = prediction.penWinner;
  }

  const { error } = await client.from("predictions").upsert(
    {
      user_id: userId,
      match_id: matchId,
      home_score: prediction.homeScore,
      away_score: prediction.awayScore,
      method: prediction.method || "regular",
      extra_home: prediction.extraHome ?? null,
      extra_away: prediction.extraAway ?? null,

      // Store the overall predicted winner
      pen_winner: winner,

      pen_home: prediction.penHome ?? null,
      pen_away: prediction.penAway ?? null,
      first_goal_team: prediction.firstGoalTeam ?? null,
      first_goal_player: prediction.firstGoalPlayer ?? null,
    },
    {
      onConflict: "user_id,match_id",
    },
  );

  if (error) throw error;
}

export async function clearPrediction(userId, matchId) {
  const client = requireClient();
  const { error } = await client
    .from("predictions")
    .delete()
    .eq("user_id", userId)
    .eq("match_id", matchId);
  if (error) throw error;
}

// export async function getAllPredictions() {
//   const client = requireClient();
//   const { data, error } = await client
//     .from("predictions")
//     .select("user_id, match_id, home_score, away_score, method");

//   if (error) throw error;

//   return (data || []).reduce((acc, row) => {
//     if (!acc[row.user_id]) acc[row.user_id] = {};
//     acc[row.user_id][row.match_id] = {
//       homeScore: row.home_score,
//       awayScore: row.away_score,
//       method: row.method,
//     };
//     return acc;
//   }, {});
// }

export async function getLeaderboard() {
  const client = requireClient();

  const { data, error } = await client.rpc("get_leaderboard");

  if (error) throw error;

  console.log("Fetched leaderboard data:", data);
  console.table(data);
  return (data || []).map((row) => ({
    id: row.id,
    name: row.display_name,
    predicted: Number(row.predicted),
    correct: Number(row.correct),

    total: Number(row.total),
  }));
}

export async function getResults() {
  const client = requireClient();
  const { data, error } = await client
    .from("results")
    .select(
      "match_id, home_score, away_score, method, extra_home, extra_away, pen_winner, pen_home, pen_away, first_goal_team, first_goal_player",
    );

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
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
}

export async function saveResult(matchId, result) {
  const response = await fetch("/api/save-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      results: {
        [matchId]: result,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Failed to save result (${response.status})`);
  }

  return response.json();
}

export async function saveResultsBatch(resultsBatch) {
  const response = await fetch("/api/save-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results: resultsBatch }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error || `Failed to save results (${response.status})`,
    );
  }

  const body = await response.json();
  return body.results || resultsBatch;
}
