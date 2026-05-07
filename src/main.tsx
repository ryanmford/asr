import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Global incredibly subtle haptic feedback for all tactile elements
if (typeof window !== "undefined") {
  window.addEventListener('touchstart', (e) => {
    const target = e.target as HTMLElement;
    const closestClickable = target.closest('button, a, [role="button"], [class*="active:scale-"]');
    if (closestClickable) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(2); // 2ms is barely noticeable, providing that microscopic tactile feel
      }
    }
  }, { passive: true });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
