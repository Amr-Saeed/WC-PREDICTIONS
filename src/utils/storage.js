// All data lives in localStorage, scoped under these keys.
// Since there's no backend, "shared" data (users, results, predictions)
// is shared across anyone using the same browser. To make it shared across
// different devices/browsers, swap these functions for real API calls
// (e.g. to Firebase, Supabase, or your own backend).

const USERS_KEY = "wc_users";
const RESULTS_KEY = "wc_results";
const PREDICTIONS_PREFIX = "wc_predictions_";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Failed to read ${key}`, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key}`, e);
  }
}

// ---- Users ----

export function getAllUsers() {
  return readJSON(USERS_KEY, []); // [{ id, name }]
}

export function findUserByName(name) {
  const users = getAllUsers();
  return users.find((u) => u.name.toLowerCase() === name.toLowerCase()) || null;
}

export function createUser(name) {
  const id = "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const user = { id, name };
  const users = getAllUsers();
  users.push(user);
  writeJSON(USERS_KEY, users);
  return user;
}

// ---- Match results (the real outcomes, entered by an admin) ----

export function getResults() {
  return readJSON(RESULTS_KEY, {}); // { matchId: { homeScore, awayScore, method } }
}

export function saveResult(matchId, result) {
  const results = getResults();
  results[matchId] = result;
  writeJSON(RESULTS_KEY, results);
  return results;
}

// Merges a batch of { matchId: result } into existing results (e.g. from an API sync).
// Existing manually-entered results for matches not included in the batch are left untouched.
export function saveResultsBatch(resultsBatch) {
  const results = getResults();
  Object.assign(results, resultsBatch);
  writeJSON(RESULTS_KEY, results);
  return results;
}

// ---- Predictions (per user) ----

export function getPredictions(userId) {
  return readJSON(PREDICTIONS_PREFIX + userId, {}); // { matchId: { homeScore, awayScore, method } }
}

export function savePrediction(userId, matchId, prediction) {
  const predictions = getPredictions(userId);
  predictions[matchId] = prediction;
  writeJSON(PREDICTIONS_PREFIX + userId, predictions);
  return predictions;
}

export function clearPrediction(userId, matchId) {
  const predictions = getPredictions(userId);
  delete predictions[matchId];
  writeJSON(PREDICTIONS_PREFIX + userId, predictions);
  return predictions;
}

export function getAllPredictions() {
  // Returns { userId: { matchId: prediction } } for every known user
  const users = getAllUsers();
  const map = {};
  users.forEach((u) => {
    map[u.id] = getPredictions(u.id);
  });
  return map;
}
