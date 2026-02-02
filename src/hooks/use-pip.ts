"use client";

import { useState, useCallback, useEffect } from "react";

export function usePiP() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const togglePiP = useCallback(async () => {
    // Check if API is supported
    if (!("documentPictureInPicture" in window)) {
      alert("Document Picture-in-Picture is not supported in this browser. Please use Chrome or Edge 116+.");
      return;
    }

    // Close if already open
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }

    try {
      // Open new PiP window
      // @ts-ignore - Types might not be up to date for this new API
      const win = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 150,
      });

      // Copy styles from main window to PiP window so Tailwind works
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules]
            .map((rule) => rule.cssText)
            .join("");
          const style = document.createElement("style");
          style.textContent = cssRules;
          win.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement("link");
          if (styleSheet.href) {
            link.rel = "stylesheet";
            link.type = styleSheet.type;
            link.media = styleSheet.media.toString();
            link.href = styleSheet.href;
            win.document.head.appendChild(link);
          }
        }
      });

      // Copy root classes (for dark mode)
      win.document.documentElement.className = document.documentElement.className;
      
      // Reset body styles to prevent default margins and scrolling
      win.document.body.style.margin = "0";
      win.document.body.style.overflow = "hidden";
      
      // Observe theme changes on main window and sync to PiP
      const observer = new MutationObserver(() => {
          win.document.documentElement.className = document.documentElement.className;
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      // Listen for close event
      win.addEventListener("pagehide", () => {
        setPipWindow(null);
        observer.disconnect();
      });

      setPipWindow(win);
    } catch (err) {
      console.error("Failed to open PiP window:", err);
    }
  }, [pipWindow]);

  // Close PiP if main window unmounts/reloads
  useEffect(() => {
     return () => {
         if (pipWindow) {
             pipWindow.close();
         }
     };
  }, [pipWindow]);

  return { pipWindow, togglePiP };
}
