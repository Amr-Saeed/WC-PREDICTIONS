import { useState } from "react";

export default function Gate({ onEnter }) {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    const trimmed = nameInput.trim();
    const emailTrimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    if (trimmed.length > 30) {
      setError("Name too long (max 30 chars).");
      return;
    }

    if (!emailTrimmed) {
      setError("Please enter your email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const result = await onEnter(trimmed, emailTrimmed);
      if (result?.message) setSuccess(result.message);
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate">
      <div className="trophy-big">🏆</div>
      <h1>World Cup 2026</h1>
      <div className="sub">Round of 32 · Prediction Game</div>
      {success && (
        <div className="gate-toast" role="status" aria-live="polite">
          <div className="gate-toast-title">Check your email</div>
          <div className="gate-toast-body">{success}</div>
        </div>
      )}
      <div className="gate-card">
        <label>Enter your name to join</label>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEnter();
          }}
          placeholder="e.g. Amr"
          autoFocus
        />
        <label style={{ marginTop: 12 }}>Enter your email</label>
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEnter();
          }}
          placeholder="e.g. amr@example.com"
        />
        {error && <div className="err">{error}</div>}
        <button onClick={handleEnter} disabled={loading}>
          {loading ? "Sending link..." : "Send login link"}
        </button>
        <div className="existing-hint">
          Enter your name first, then your email. We will email you a Supabase
          login link and keep your entered name for the leaderboard.
        </div>
      </div>
    </div>
  );
}
