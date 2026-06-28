import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const PENDING_LOGIN_KEY = "wc_pending_login";

function requireClient() {
  if (!supabase) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export async function signInWithEmail(email, displayName) {
  const client = requireClient();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
      shouldCreateUser: true,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) throw error;

  return {
    message: "Check your email for a Supabase sign-in link.",
  };
}

export function setPendingLogin(name, email) {
  localStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify({ name, email }));
}

export function getPendingLogin() {
  try {
    const raw = localStorage.getItem(PENDING_LOGIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingLogin() {
  localStorage.removeItem(PENDING_LOGIN_KEY);
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
    .select("id, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProfile(userId, displayName) {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .upsert({ id: userId, display_name: displayName }, { onConflict: "id" })
    .select("id, display_name")
    .single();

  if (error) throw error;
  return data;
}

export async function listProfiles() {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPredictions(userId) {
  const client = requireClient();
  const { data, error } = await client
    .from("predictions")
    .select("match_id, home_score, away_score, method")
    .eq("user_id", userId);

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
    acc[row.match_id] = {
      homeScore: row.home_score,
      awayScore: row.away_score,
      method: row.method,
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

export async function getAllPredictions() {
  const client = requireClient();
  const { data, error } = await client
    .from("predictions")
    .select("user_id, match_id, home_score, away_score, method");

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
    if (!acc[row.user_id]) acc[row.user_id] = {};
    acc[row.user_id][row.match_id] = {
      homeScore: row.home_score,
      awayScore: row.away_score,
      method: row.method,
    };
    return acc;
  }, {});
}

export async function getResults() {
  const client = requireClient();
  const { data, error } = await client
    .from("results")
    .select("match_id, home_score, away_score, method");

  if (error) throw error;

  return (data || []).reduce((acc, row) => {
    acc[row.match_id] = {
      homeScore: row.home_score,
      awayScore: row.away_score,
      method: row.method,
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
