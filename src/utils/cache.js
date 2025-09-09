// src/utils/cache.js
const KEY = "repliedQueries_v1";

export const loadRepliedQueries = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load replied queries from localStorage", err);
    return null;
  }
};

export const saveRepliedQueries = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Failed to save replied queries to localStorage", err);
  }
};

export const clearRepliedQueries = () => {
  try {
    localStorage.removeItem(KEY);
  } catch (err) {
    console.warn("Failed to clear replied queries from localStorage", err);
  }
};
