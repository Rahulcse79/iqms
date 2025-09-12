// ================================
// Theme + layout updates (multiple files below)
// Drop these into your project (see integration notes at the bottom)
// ================================

/* ==================================================================
   File: src/hooks/useTheme.js
   Simple hook to persist theme in localStorage and add theme class to <html>
   ==================================================================*/

import { useState, useEffect } from "react";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("app-theme");
    if (stored) return stored;
  } catch (e) {
    /* ignore */
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${theme}`);
    try {
      localStorage.setItem("app-theme", theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return { theme, setTheme, toggleTheme };
}