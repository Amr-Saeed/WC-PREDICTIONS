import React from "react";
import ReactDOM from "react-dom/client";
import OneSignal from "react-onesignal";

import App from "./App.jsx";
import "./index.css";

async function startApp() {
  await OneSignal.init({
    appId: "00c6284a-0f9c-42b7-916d-e615df732aa0",
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerPath: "OneSignalSDKWorker.js",
    serviceWorkerParam: { scope: "/" },
  });

  // You need this — init alone does NOT prompt the user
  OneSignal.Notifications.requestPermission();
  console.log("Permission:", OneSignal.Notifications.permission);

  console.log("Subscribed:", OneSignal.User.PushSubscription.optedIn);

  console.log("Subscription ID:", OneSignal.User.PushSubscription.id);

  console.log("OneSignal User ID:", OneSignal.User.onesignalId);
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

startApp();
