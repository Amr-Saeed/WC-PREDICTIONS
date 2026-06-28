import { useEffect, useMemo, useState } from "react";
import { MATCHES } from "./data/matches";
import { computePoints } from "./utils/scoring";
import {
  findUserByName,
  createUser,
  getResults,
  saveResult as persistResult,
  saveResultsBatch,
  getPredictions,
  savePrediction as persistPrediction,
  clearPrediction as persistClearPrediction,
  getAllUsers,
  getAllPredictions,
} from "./utils/storage";

import Gate from "./components/Gate";
import Header from "./components/Header";
import Nav from "./components/Nav";
import MatchesView from "./components/MatchesView";
import MatchModal from "./components/MatchModal";
import LeaderboardView from "./components/LeaderboardView";

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("matches");
  const [predictions, setPredictions] = useState({});
  const [results, setResults] = useState({});
  const [activeMatch, setActiveMatch] = useState(null);

  // Load actual results once on mount
  useEffect(() => {
    setResults(getResults());
  }, []);

  // Load this user's predictions whenever the user changes
  useEffect(() => {
    if (!user) return;
    setPredictions(getPredictions(user.id));
  }, [user]);

  const handleEnter = (name) => {
    const existing = findUserByName(name);
    const u = existing || createUser(name);
    setUser(u);
  };

  const switchUser = () => {
    setUser(null);
    setPredictions({});
  };

  const savePrediction = (matchId, prediction) => {
    const next = persistPrediction(user.id, matchId, prediction);
    setPredictions(next);
  };

  const clearPrediction = (matchId) => {
    const next = persistClearPrediction(user.id, matchId);
    setPredictions(next);
  };

  const saveResult = (matchId, result) => {
    const next = persistResult(matchId, result);
    setResults(next);
  };

  const handleSyncResults = (resultsBatch) => {
    const next = saveResultsBatch(resultsBatch);
    setResults(next);
  };

  // Recompute leaderboard whenever results change or the leaderboard tab is opened
  const leaderboard = useMemo(() => {
    const users = getAllUsers();
    const allPredictions = getAllPredictions();

    return users
      .map((u) => {
        const preds = allPredictions[u.id] || {};
        let total = 0;
        let correct = 0;
        let predicted = 0;

        MATCHES.forEach((m) => {
          const p = preds[m.id];
          const r = results[m.id];
          if (p) predicted += 1;
          const pts = computePoints(p, r);
          if (pts > 0) correct += 1;
          total += pts;
        });

        return { ...u, total, correct, predicted };
      })
      .sort((a, b) => b.total - a.total || b.correct - a.correct);
  }, [results, view]); // re-derive when switching to leaderboard too, in case other users were added

  if (!user) {
    return <Gate onEnter={handleEnter} />;
  }

  return (
    <div className="app">
      <Header user={user} onSwitchUser={switchUser} />
      <Nav view={view} setView={setView} />

      {view === "matches" && (
        <MatchesView predictions={predictions} results={results} onOpen={setActiveMatch} />
      )}

      {view === "leaderboard" && (
        <LeaderboardView
          leaderboard={leaderboard}
          currentUserId={user.id}
          onSync={handleSyncResults}
        />
      )}

      {activeMatch && (
        <MatchModal
          match={activeMatch}
          prediction={predictions[activeMatch.id]}
          result={results[activeMatch.id]}
          onClose={() => setActiveMatch(null)}
          onSave={(pred) => savePrediction(activeMatch.id, pred)}
          onClear={() => clearPrediction(activeMatch.id)}
          onSaveResult={(res) => saveResult(activeMatch.id, res)}
        />
      )}

      <div className="footer-note">
        Predict the winner & scoreline for each match. Get it right for 1 point.
        <br />
        Bonus: +1 if you also called Extra Time correctly, +2 if you called Penalties correctly.
        <br />
        No login needed — just your name. Predictions are stored locally in this browser.
      </div>
    </div>
  );
}
