"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              toast("A new version is available", {
                action: {
                  label: "Refresh",
                  onClick: () => newWorker.postMessage("SKIP_WAITING"),
                },
                duration: 15000,
              });
            }
          });
        });
      })
      .catch((err) => console.error("Service worker registration failed:", err));
  }, []);

  return null;
}
