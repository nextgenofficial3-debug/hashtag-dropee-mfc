import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-update service worker: detect new versions and reload seamlessly
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwabuilder-sw.js').then((registration) => {
    // Check for updates every 60 seconds
    setInterval(() => registration.update(), 60 * 1000);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          // New SW activated — reload to get latest content
          window.location.reload();
        }
      });
    });
  });

  // When the controlling SW changes (e.g. after skipWaiting), reload
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
