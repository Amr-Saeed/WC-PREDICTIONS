import { useEffect, useState } from "react";
import { MATCHES } from "./data/matches";
import { computePoints } from "./utils/scoring";
import { fetchMatchKickoffs, fetchRealResults } from "./utils/footballApi";

import {
  supabase,
  getCurrentUser,
  getProfile,
  upsertProfile,
  getResults,
  saveResultsBatch,
  savePrediction as persistPrediction,
  clearPrediction as persistClearPrediction,
  getLeaderboard,
  getPredictions,
  listProfiles,
  signInWithEmail,
  signOut,
} from "./utils/storage";

import Gate from "./components/Gate";
import Header from "./components/Header";
import Nav from "./components/Nav";
import MatchesView from "./components/MatchesView";
import MatchModal from "./components/MatchModal";
import LeaderboardView from "./components/LeaderboardView";

// function buildLeaderboard(profiles, predictionsByUser, results) {
//   return profiles
//     .map((profile) => {
//       const preds = predictionsByUser[profile.id] || {};
//       let total = 0;
//       let correct = 0;
//       let predicted = 0;

//       MATCHES.forEach((match) => {
//         const prediction = preds[match.id];
//         const result = results[match.id];

//         if (prediction) predicted += 1;

//         const points = computePoints(prediction, result);
//         if (points > 0) correct += 1;
//         total += points;
//       });

//       return {
//         id: profile.id,
//         name: profile.display_name,
//         total,
//         correct,
//         predicted,
//       };
//     })
//     .sort(
//       (a, b) =>
//         b.total - a.total ||
//         b.correct - a.correct ||
//         a.name.localeCompare(b.name),
//     );
// }

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("matches");
  const [predictions, setPredictions] = useState({});
  const [results, setResults] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [matchKickoffs, setMatchKickoffs] = useState({});
  const [activeMatch, setActiveMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncingLeaderboard, setSyncingLeaderboard] = useState(false);
  const refreshSharedData = async (userId) => {
    const [leaderboard, myPredictions, allResults] = await Promise.all([
      getLeaderboard(),
      getPredictions(userId),
      getResults(),
    ]);

    setLeaderboard(leaderboard);
    setPredictions(myPredictions);
    setResults(allResults);
  };

  const loadKickoffTimes = async () => {
    try {
      const kickoffs = await fetchMatchKickoffs();
      setMatchKickoffs(kickoffs);
    } catch (err) {
      console.warn("Failed to load kickoff times:", err);
    }
  };

  useEffect(() => {
    let alive = true;

    const bootstrap = async () => {
      if (!supabase) {
        if (alive) {
          setError("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.");
          setLoading(false);
        }
        return;
      }

      try {
        await loadKickoffTimes();
        let currentUser = null;

        try {
          currentUser = await getCurrentUser();
        } catch (authErr) {
          console.warn("Stale auth session detected, clearing it.", authErr);
          try {
            await signOut();
          } catch {
            // Ignore secondary sign-out errors for a missing/deleted user.
          }
          currentUser = null;
        }

        if (!alive) return;

        if (currentUser) {
          const fallbackName =
            currentUser.user_metadata?.display_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split("@")[0] ||
            "Player";

          const profile =
            (await getProfile(currentUser.id)) ||
            (await upsertProfile(
              currentUser.id,
              fallbackName,
              currentUser.email,
            ));
          setUser({ id: profile.id, name: profile.display_name });
          // 👇 identify returning user too
          await refreshSharedData(currentUser.id);
        }
      } catch (err) {
        if (alive) {
          setError(err.message || "Failed to load Supabase session.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (view !== "leaderboard" || !user) return;

    syncResults();
  }, [view, user]);

  const handleEnter = async (name, email, password) => {
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const result = await signInWithEmail(
      normalizedEmail,
      name.trim(),
      password,
    );

    const profile =
      (await getProfile(result.user.id)) ||
      (await upsertProfile(result.user.id, name.trim(), normalizedEmail));

    setUser({ id: profile.id, name: profile.display_name });
    setView("matches");
    await refreshSharedData(profile.id);

    return { message: result.message };
  };

  const switchUser = async () => {
    await signOut();

    setUser(null);
    setPredictions({});
    setResults({});
    setLeaderboard([]);
    setView("matches");
  };

  const savePrediction = async (matchId, prediction) => {
    await persistPrediction(user.id, matchId, prediction);
    await refreshSharedData(user.id);
  };

  const clearPrediction = async (matchId) => {
    await persistClearPrediction(user.id, matchId);
    await refreshSharedData(user.id);
  };

  const syncResults = async () => {
    if (syncingLeaderboard) return;

    setSyncingLeaderboard(true);

    try {
      console.log("Syncing real results from API...");

      const { results } = await fetchRealResults();

      await handleSyncResults(results);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sync results.");
    } finally {
      setSyncingLeaderboard(false);
    }
  };

  const handleSyncResults = async (resultsBatch) => {
    const next = await saveResultsBatch(resultsBatch);
    if (next) {
      setResults(next);
    }
    await refreshSharedData(user?.id);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="empty-state">Loading leaderboard...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="app">
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  if (!user) {
    return <Gate onEnter={handleEnter} />;
  }

  return (
    <div className="app">
      <Header user={user} onSwitchUser={switchUser} />
      <Nav view={view} setView={setView} />

      {view === "matches" && (
        <MatchesView
          predictions={predictions}
          results={results}
          matchKickoffs={matchKickoffs}
          onOpen={setActiveMatch}
        />
      )}

      {view === "leaderboard" &&
        (syncingLeaderboard ? (
          <div className="leaderboard-loading">
            <div className="spinner"></div>
            <p>Updating latest match results...</p>
          </div>
        ) : (
          <LeaderboardView
            leaderboard={leaderboard}
            currentUserId={user.id}
            onSync={syncResults}
            syncing={syncingLeaderboard}
          />
        ))}

      {activeMatch && (
        <MatchModal
          match={activeMatch}
          prediction={predictions[activeMatch.id]}
          result={results[activeMatch.id]}
          onClose={() => setActiveMatch(null)}
          onSave={(pred) => savePrediction(activeMatch.id, pred)}
          onClear={() => clearPrediction(activeMatch.id)}
        />
      )}

      <div className="footer-note">
        Predict the winner & scoreline for each match. Your predictions are
        stored in Supabase.
        <br />
        Bonus: +1 if you also called Extra Time correctly, +2 if you called
        Penalties correctly.
      </div>

      {error && <div className="footer-note">{error}</div>}
    </div>
  );
}
