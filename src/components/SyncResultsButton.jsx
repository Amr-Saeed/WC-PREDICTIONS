import { useState } from "react";
import { fetchRealResults } from "../utils/footballApi";

export default function SyncResultsButton({ onSynced }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const { results, unmatched } = await fetchRealResults();
      const count = Object.keys(results).length;
      onSynced(results);
      setStatus("done");
      if (unmatched.length > 0) {
        setMessage(
          `Synced ${count} finished match${count === 1 ? "" : "es"}. ${unmatched.length} match(es) couldn't be matched by team name — check footballApi.js name aliases.`
        );
      } else {
        setMessage(`Synced ${count} finished match${count === 1 ? "" : "es"}.`);
      }
    } catch (e) {
      setStatus("error");
      setMessage(e.message || "Something went wrong while syncing.");
    }
  };

  return (
    <div className="sync-box">
      <button className="sync-btn" onClick={handleSync} disabled={status === "loading"}>
        {status === "loading" ? "Syncing…" : "🔄 Sync real results from API"}
      </button>
      {message && (
        <div className={"sync-message" + (status === "error" ? " error" : "")}>{message}</div>
      )}
    </div>
  );
}
