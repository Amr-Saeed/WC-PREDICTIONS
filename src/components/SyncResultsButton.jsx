export default function SyncResultsButton({ onSync, syncing }) {
  return (
    <button className="sync-btn" onClick={onSync} disabled={syncing}>
      {syncing ? "Refreshing..." : "🔄 Refresh latest results"}
    </button>
  );
}
