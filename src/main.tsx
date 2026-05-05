import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import "./index.css";

/**
 * A Workbox service worker (from a prior `vite preview` or production build) can keep serving
 * old hashed JS/CSS, so the UI looks unchanged even after a hard reload. In dev, unregister
 * before boot so the browser always uses Vite’s live module graph.
 */
async function clearDevServiceWorker() {
  if (!import.meta.env.DEV || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
}

void clearDevServiceWorker()
  .catch(() => {})
  .finally(() => {
    createRoot(document.getElementById("root")!).render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
  });
