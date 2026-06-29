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

function loginPasswordForEmail(email) {
  return email.trim().toLowerCase();
}

export async function signInWithEmail(email, displayName) {
  const client = requireClient();
  const password = loginPasswordForEmail(email);
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile, error: existingProfileError } = await client
    .from("profiles")
    .select("id, email, display_name")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingProfileError) throw existingProfileError;

  const { data: signInData, error: signInError } =
    await client.auth.signInWithPassword({
      email,
      password,
    });

  if (signInData?.user) {
    await upsertProfile(
      signInData.user.id,
      displayName || signInData.user.email || normalizedEmail,
      normalizedEmail,
    );
    return {
      user: signInData.user,
      message: `Logged in as ${displayName || signInData.user.email || normalizedEmail}`,
    };
  }

  if (existingProfile?.id) {
    throw new Error(
      "This email is already registered. Sign in with the same email and password, or contact support if you previously used a different login method.",
    );
  }

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: displayName
        ? { display_name: displayName, email: normalizedEmail }
        : { email: normalizedEmail },
    },
  });

  if (signUpError) {
    throw signUpError;
  }

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
        displayName || signInAfterSignUp.user.email || normalizedEmail,
        normalizedEmail,
      );
      return {
        user: signInAfterSignUp.user,
        message: `Logged in as ${displayName || signInAfterSignUp.user.email || normalizedEmail}`,
      };
    }
  }

  if (signInError) throw signInError;

  throw new Error("Unable to log in.");
}

export async function getCurrentUser() {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user || null;
}

export async function signOut() {
  const client = requireClient();
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
      "match_id, home_score, away_score, method, extra_home, extra_away, pen_winner, pen_home, pen_away",
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
    };
    return acc;
  }, {});
}

export async function savePrediction(userId, matchId, prediction) {
  const client = requireClient();
  const { error } = await client.from("predictions").upsert(
    {
      user_id: userId,
      match_id: matchId,
      home_score: prediction.homeScore,
      away_score: prediction.awayScore,
      method: prediction.method || "regular",
      extra_home: prediction.extraHome ?? null,
      extra_away: prediction.extraAway ?? null,
      pen_winner: prediction.penWinner ?? null,
      pen_home: prediction.penHome ?? null,
      pen_away: prediction.penAway ?? null,
    },
    { onConflict: "user_id,match_id" },
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
      "match_id, home_score, away_score, method, extra_home, extra_away, pen_winner, pen_home, pen_away",
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
