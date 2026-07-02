import { useState } from "react";
import { supabase } from "../utils/storage";

export default function Gate({ onEnter }) {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

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
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    try {
      setLoading(true);
      const result = await onEnter(trimmed, emailTrimmed, password);
      if (result?.message) setError("");
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const trimmedEmail = forgotEmail.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: window.location.origin,
        },
      );
      if (error) throw error;
      setForgotSent(true);
    } catch (e) {
      setForgotError(e.message || "Something went wrong.");
    } finally {
      setForgotLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") handleEnter();
  };

  // "Check your email" screen after reset is requested
  if (forgotSent) {
    return (
      <div className="gate">
        <div className="trophy-big">📧</div>
        <h1>Check your email</h1>
        <div className="sub">Password reset link sent</div>
        <div className="gate-card">
          <div
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "var(--text-dim)",
              lineHeight: 1.7,
            }}
          >
            We sent a reset link to{" "}
            <b style={{ color: "var(--text)" }}>{forgotEmail.trim()}</b>.
            <br />
            Click the link in the email to set a new password.
            <br />
            <br />
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
              Don't see it? Check your spam folder.
              <br />
              The link expires in 1 hour.
            </span>
          </div>
          <button
            onClick={() => {
              setForgotSent(false);
              setForgotOpen(false);
              setForgotEmail("");
            }}
            style={{ marginTop: 20 }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Forgot password form
  if (forgotOpen) {
    return (
      <div className="gate">
        <div className="trophy-big">🔑</div>
        <h1>Reset Password</h1>
        <div className="sub">We'll send you a link</div>
        <div className="gate-card">
          <label>Your email</label>
          <input
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleForgot();
            }}
            placeholder="you@example.com"
            autoFocus
          />
          {forgotError && <div className="err">{forgotError}</div>}
          <button
            onClick={handleForgot}
            disabled={forgotLoading}
            style={{ marginTop: 16 }}
          >
            {forgotLoading ? "Sending…" : "Send reset link"}
          </button>
          <button
            onClick={() => {
              setForgotOpen(false);
              setForgotError("");
              setForgotEmail("");
            }}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "11px",
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: "transparent",
              color: "var(--text-faint)",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Normal login screen
  return (
    <div className="gate">
      <div className="trophy-big">🏆</div>
      <h1>World Cup 2026</h1>
      <div className="sub">Round of 32 · Prediction Game</div>
      <div className="gate-card">
        <label>Enter your name to join</label>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="e.g. Amr"
          autoFocus
        />
        <label style={{ marginTop: 12 }}>Enter your email</label>
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="e.g. amr@example.com"
        />
        <label style={{ marginTop: 12 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKey}
          placeholder="At least 6 characters"
        />

        <div style={{ textAlign: "right", marginTop: 6 }}>
          <span
            onClick={() => {
              setForgotOpen(true);
              setForgotError("");
              setForgotEmail(emailInput);
            }}
            style={{
              fontSize: 12,
              color: "var(--teal)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Forgot password?
          </span>
        </div>

        {error && <div className="err">{error}</div>}
        <button onClick={handleEnter} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="existing-hint">
          Enter your name, email and password. New here? We'll create your
          account automatically.
        </div>
      </div>
    </div>
  );
}
