import { useState } from "react";

export default function Gate({ onEnter }) {
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");

  const handleEnter = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    if (trimmed.length > 30) {
      setError("Name too long (max 30 chars).");
      return;
    }
    setError("");
    onEnter(trimmed);
  };

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
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEnter();
          }}
          placeholder="e.g. Amr"
          autoFocus
        />
        {error && <div className="err">{error}</div>}
        <button onClick={handleEnter}>Enter Predictions</button>
        <div className="existing-hint">
          If your name was used before on this device, you'll resume your existing predictions.
        </div>
      </div>
    </div>
  );
}
