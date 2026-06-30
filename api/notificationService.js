// src/services/notificationService.js

import { supabase } from "../src/utils/storage";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// ✅ Fix: Convert VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  // Remove any whitespace and ensure correct padding
  const cleaned = base64String.trim();
  const padding = "=".repeat((4 - (cleaned.length % 4)) % 4);
  const base64 = (cleaned + padding).replace(/-/g, "+").replace(/_/g, "/");

  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.error("Failed to decode VAPID key:", e);
    return null;
  }
};

// Check if browser supports notifications
const isNotificationSupported = () => {
  return "Notification" in window && "serviceWorker" in navigator;
};

// Auto-request permission and subscribe
export const setupNotifications = async () => {
  console.log("🔔 setupNotifications called");

  if (!isNotificationSupported()) {
    console.warn("Notifications not supported");
    return false;
  }

  try {
    if (Notification.permission === "granted") {
      console.log("✅ Notification permission already granted");
      return await subscribeToPush();
    }

    if (Notification.permission === "default") {
      console.log("📨 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("Permission result:", permission);

      if (permission === "granted") {
        return await subscribeToPush();
      }
    }

    console.log("❌ Notification permission not granted");
    return false;
  } catch (error) {
    console.error("Error setting up notifications:", error);
    return false;
  }
};

// Subscribe to push notifications
export const subscribeToPush = async () => {
  console.log("📡 Subscribing to push notifications...");

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("✅ Service worker ready");

    // Check if already subscribed
    const existingSubscription =
      await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log("✅ Already subscribed");
      return true;
    }

    console.log("🔄 Creating new subscription...");
    console.log("VAPID Key present:", !!VAPID_PUBLIC_KEY);

    // ✅ Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    if (!applicationServerKey) {
      console.error("❌ Failed to convert VAPID key");
      return false;
    }

    console.log("✅ VAPID key converted, length:", applicationServerKey.length);

    // ✅ Try subscription with explicit error handling
    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    } catch (subError) {
      console.error("❌ Push subscription error:", subError);

      // Try alternative: use the key as string (some browsers expect this)
      try {
        console.log("🔄 Trying subscription with string VAPID key...");
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: VAPID_PUBLIC_KEY,
        });
      } catch (subError2) {
        console.error("❌ Second subscription attempt failed:", subError2);
        throw subError2;
      }
    }

    console.log("✅ Subscription created:", subscription);

    const saved = await saveSubscription(subscription);

    if (saved) {
      console.log("✅ Subscription saved successfully!");
      return true;
    } else {
      console.error("❌ Failed to save subscription to Supabase");
      return false;
    }
  } catch (error) {
    console.error("Error subscribing to push:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return false;
  }
};

// Save subscription to Supabase
export const saveSubscription = async (subscription) => {
  console.log("💾 Saving subscription to Supabase...");

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Error getting user:", userError);
      return false;
    }

    if (!user) {
      console.warn("❌ User not authenticated");
      return false;
    }

    console.log("👤 User ID:", user.id);

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        subscription: subscription,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      console.error("❌ Supabase error:", error);
      return false;
    }

    console.log("✅ Subscription saved successfully for user:", user.id);
    return true;
  } catch (error) {
    console.error("Error saving subscription:", error);
    return false;
  }
};

// Unsubscribe
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return false;
  }
};

// Send notification via Edge Function
export const sendNotification = async (userId, title, body, url = "/") => {
  console.log("📤 Sending notification to user:", userId);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          url,
          icon: "/icon-192.png",
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Server error:", error);
      throw new Error(error.error || "Failed to send notification");
    }

    const data = await response.json();
    console.log("✅ Notification sent:", data);
    return data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
