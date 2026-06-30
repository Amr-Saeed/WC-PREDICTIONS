// src/components/EnableNotificationsButton.jsx
import React, { useState } from "react";
import { setupNotifications } from "../../api/notificationService";
import { supabase } from "../utils/storage";

export const EnableNotificationsButton = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleEnable = async () => {
    setLoading(true);
    setStatus("⏳ Starting...");

    try {
      // Step 1: Check user
      setStatus("🔍 Checking user...");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("❌ Please login first");
        setLoading(false);
        return;
      }
      setStatus(`👤 User: ${user.email}`);

      // Step 2: Check service worker
      setStatus("📡 Checking service worker...");
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        setStatus("❌ No service worker. Reload page.");
        setLoading(false);
        return;
      }
      setStatus("✅ Service worker found");

      // Step 3: Request permission
      setStatus("📨 Requesting permission...");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("❌ Permission denied");
        setLoading(false);
        return;
      }
      setStatus("✅ Permission granted");

      // Step 4: Setup notifications
      setStatus("🔔 Setting up notifications...");
      const result = await setupNotifications();

      if (result) {
        setStatus("✅ Notifications enabled successfully! 🎉");

        // Verify database entry
        const { data: verify } = await supabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (verify) {
          setStatus("✅ Verified in database! 🎉");
        } else {
          setStatus("⚠️ Enabled but not in database. Check console.");
        }

        alert("✅ Notifications enabled successfully!");
      } else {
        setStatus("❌ Failed to enable notifications. Check console.");
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "10px" }}>
      <button
        onClick={handleEnable}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: loading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "⏳ Enabling..." : "🔔 Enable Notifications"}
      </button>
      {status && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "14px",
            color: status.includes("❌")
              ? "red"
              : status.includes("✅")
                ? "green"
                : "blue",
            wordBreak: "break-all",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};
