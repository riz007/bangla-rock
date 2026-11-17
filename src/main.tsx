import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./player.css";

// Browser agents that speak WebMCP can read and drive the crate's controls.
if ("modelContext" in document) void import("./agent");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
