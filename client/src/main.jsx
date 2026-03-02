import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

import ErrorBoundary from "./components/ErrorBoundary";

const routerBase = (() => {
  const rawBase = String(import.meta.env.BASE_URL || "/");
  const normalized = rawBase.replace(/\/+$/, "");
  if (!normalized || normalized === "/") return undefined;
  return normalized;
})();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={routerBase}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
