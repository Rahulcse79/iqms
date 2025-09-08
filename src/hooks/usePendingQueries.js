// src/hooks/usePendingQueries.js
import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/pendingQuery";

/**
 * usePendingQueries
 * - cat: category number (1 = officer, 2 = civilian)
 * - pendingWith: full code like "U1A" or null
 *
 * Returns: { data, loading, error, refresh }
 */
export default function usePendingQueries(cat = 1, pendingWith = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchAllPages = useCallback(async () => {
    // If no pendingWith provided, clear data and return
    if (!pendingWith) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Abort any previous fetch
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setData([]);

    try {
      let allItems = [];
      let offset = 0;
      let hasMore = true;
      let guard = 0; // safety guard to avoid infinite loops

      while (hasMore && !controller.signal.aborted && guard < 500) {
        // Build URL like: /pendingQuery/1/U1A/?offset=100
        const url = `${API_BASE}/${encodeURIComponent(cat)}/${encodeURIComponent(
          pendingWith
        )}?offset=${offset}`;

        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) {
          throw new Error(`Server returned ${resp.status}`);
        }

        const json = await resp.json();

        if (Array.isArray(json.items) && json.items.length > 0) {
          allItems = allItems.concat(json.items);
        }

        // API indicates more with hasMore boolean
        hasMore = Boolean(json.hasMore);

        // Increase offset by returned limit if present; else fallback to items length or 100
        const limit =
          typeof json.limit === "number"
            ? json.limit
            : Array.isArray(json.items) && json.items.length > 0
            ? json.items.length
            : 100;

        offset += limit;
        guard += 1;
      }

      setData(allItems);
    } catch (err) {
      if (err.name === "AbortError") {
        // expected on unmount / new request
        return;
      }
      setError(err.message || "Failed to load pending queries");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [cat, pendingWith]);

  // fetch when cat or pendingWith changes
  useEffect(() => {
    fetchAllPages();
    return () => {
      // cancel on unmount
      abortRef.current?.abort();
    };
  }, [fetchAllPages]);

  return {
    data,
    loading,
    error,
    refresh: fetchAllPages,
  };
}
