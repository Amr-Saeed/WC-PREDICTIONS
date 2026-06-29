import React from "react";
import ReactDOM from "react-dom/client";
import OneSignal from "react-onesignal";

import App from "./App.jsx";
import "./index.css";

async function startApp() {
  await OneSignal.init({
    appId: "00c6284a-0f9c-42b7-916d-e615df732aa0",

    // Remove this after deploying if you want.
    allowLocalhostAsSecureOrigin: true,
  });

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

startApp();
