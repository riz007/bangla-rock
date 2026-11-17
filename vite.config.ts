import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { seoPages } from "./scripts/seo-plugin";

// Served from the domain root so pre-rendered /album/<id>/ pages resolve /assets/ correctly.
export default defineConfig({ base: "/", plugins: [react(), seoPages()] });
