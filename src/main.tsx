import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadKlassen } from "../utils/klassen";

(async () => {
  try {
    await loadKlassen();
  } catch (err) {
    console.error('[main.tsx] loadKlassen mislukt:', err);
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
