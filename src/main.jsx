import React from "react";
import ReactDOM from "react-dom/client";
import OneSignal from "react-onesignal";
import { getCurrentUser } from "./utils/storage";

import App from "./App.jsx";
import "./index.css";

// async function startApp() {
//   await OneSignal.init({
//     appId: "00c6284a-0f9c-42b7-916d-e615df732aa0",
//     allowLocalhostAsSecureOrigin: true,
//     serviceWorkerPath: "/OneSignalSDKWorker.js",
//     serviceWorkerParam: { scope: "/" },
//   });
//   // Login BEFORE rendering so subscription always attaches to the right user
//   const currentUser = await getCurrentUser();
//   if (currentUser) {
//     await OneSignal.login(currentUser.id);
//   }

// }

// startApp();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
