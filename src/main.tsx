import React from "react";
import { createRoot } from "react-dom/client";
import App from "app";
import { initDebug } from "app/debug";
import "shared/styles.css";

initDebug();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
