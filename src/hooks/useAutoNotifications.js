// src/hooks/useAutoNotifications.js
import { useEffect, useState } from "react";
import {
  setupNotifications,
  unsubscribeFromPush,
} from "../services/notificationService";

export const useAutoNotifications = (isAuthenticated) => {
  const [notificationStatus, setNotificationStatus] = useState({
    enabled: false,
    loading: false,
    permission: Notification.permission || "default",
  });

  useEffect(() => {
    // Only run when user is authenticated
    if (!isAuthenticated) {
      // Optionally unsubscribe when user logs out
      unsubscribeFromPush();
      setNotificationStatus({
        enabled: false,
        loading: false,
        permission: Notification.permission || "default",
      });
      return;
    }

    // Auto setup notifications
    const autoSetup = async () => {
      setNotificationStatus((prev) => ({ ...prev, loading: true }));

      try {
        const success = await setupNotifications();
        setNotificationStatus({
          enabled: success,
          loading: false,
          permission: Notification.permission,
        });
      } catch (error) {
        console.error("Auto notification setup failed:", error);
        setNotificationStatus({
          enabled: false,
          loading: false,
          permission: Notification.permission,
        });
      }
    };

    // Small delay to ensure service worker is ready
    const timeoutId = setTimeout(autoSetup, 1000);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated]);

  return notificationStatus;
};
