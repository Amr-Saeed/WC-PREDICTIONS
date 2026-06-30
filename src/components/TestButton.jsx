// src/components/TestButton.jsx
import React, { useState } from "react";
import { sendNotification } from "../../api/notificationService"; // ✅ Use named import

export const TestNotification = ({ userId }) => {
  const [loading, setLoading] = useState(false);

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      await sendNotification(
        userId,
        "Test Notification 🎉",
        "Your notifications are working perfectly!",
        "/",
      );
      alert("✅ Notification sent successfully! Check your browser.");
    } catch (error) {
      alert("❌ Failed to send notification: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTestNotification}
      disabled={loading}
      style={{
        padding: "10px 20px",
        margin: "10px",
        background: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      {loading ? "Sending..." : "🔔 Test Notification"}
    </button>
  );
};
