"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type DesignTheme = 
  | "original"
  | "brutalist"
  | "minimal"
  | "technical"
  | "hardware"
  | "lumina"
  | "monitor"
  | "editorial"
  | "organic"
  | "typographic";

interface DesignThemeContextType {
  designTheme: DesignTheme;
  setDesignTheme: (theme: DesignTheme) => void;
}

const DesignThemeContext = createContext<DesignThemeContextType | undefined>(undefined);

export function DesignThemeProvider({ children }: { children: React.ReactNode }) {
  const [designTheme, setDesignTheme] = useState<DesignTheme>("original");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("timewise_design_theme") as DesignTheme;
    if (savedTheme && isValidTheme(savedTheme)) {
      setDesignTheme(savedTheme);
    }
  }, []);

  const handleSetDesignTheme = (theme: DesignTheme) => {
    setDesignTheme(theme);
    localStorage.setItem("timewise_design_theme", theme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <DesignThemeContext.Provider value={{ designTheme, setDesignTheme: handleSetDesignTheme }}>
      <div className={designTheme === "brutalist" ? "design-theme-brutalist" : "design-theme-original"}>
        {children}
      </div>
    </DesignThemeContext.Provider>
  );
}

export function useDesignTheme() {
  const context = useContext(DesignThemeContext);
  if (context === undefined) {
    throw new Error("useDesignTheme must be used within a DesignThemeProvider");
  }
  return context;
}

function isValidTheme(theme: string): theme is DesignTheme {
  const validThemes: DesignTheme[] = [
    "original",
    "brutalist",
    "minimal",
    "technical",
    "hardware",
    "lumina",
    "monitor",
    "editorial",
    "organic",
    "typographic"
  ];
  return validThemes.includes(theme as DesignTheme);
}
