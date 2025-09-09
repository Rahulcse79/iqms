// src/hooks/usePendingQueries.js
import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/pendingQuery";

/**
 * usePendingQueries(cat, pendingWith)
 *
 * - auto-fetches first page whenever pendingWith changes (including mount)
 * - exposes fetchNextPage(), refresh(), and loadAll()
 * - supports links.next.href or offset+limit strategy
 * - aborts in-flight requests on tab change
 */
export default function usePendingQueries(cat = 1, pendingWith = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(100);
  const [nextHref, setNextHref] = useState(null);

  const abortRef = useRef(null);

  // Build a dedupe map by doc_id (fallback to sno+imprno+subject)
  const keyFor = (it) =>
    it && (it.doc_id || `${it.sno || ""}-${it.imprno || ""}-${it.subject || ""}`);

  const dedupeAndMerge = (prev = [], incoming = []) => {
    const map = new Map();
    prev.forEach((it) => map.set(keyFor(it), it));
    incoming.forEach((it) => map.set(keyFor(it), it));
    return Array.from(map.values());
  };

  // Core page fetcher
  const fetchPage = useCallback(
    async ({ useNext = false, requestedOffset = 0, append = false } = {}) => {
      if (!pendingWith) {
        // nothing to load for null pendingWith
        setData([]);
        setHasMore(false);
        setOffset(0);
        setNextHref(null);
        return false;
      }

      // Abort previous
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const signal = controller.signal;

      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        // Build URL
        let url;
        if (useNext && nextHref) {
          url = nextHref;
        } else {
          url = `${API_BASE}/${encodeURIComponent(cat)}/${encodeURIComponent(
            pendingWith
          )}/?offset=${requestedOffset}`;
        }

        const resp = await fetch(url, { signal });
        if (!resp.ok) throw new Error(`Server returned ${resp.status}`);

        const json = await resp.json();
        const items = Array.isArray(json.items) ? json.items : [];

        // compute returned limit (fallbacks)
        const returnedLimit =
          typeof json.limit === "number" ? json.limit : items.length > 0 ? items.length : 100;

        const newOffset = requestedOffset + returnedLimit;

        // merge or replace
        setData((prev) => (append ? dedupeAndMerge(prev, items) : items));
        setHasMore(Boolean(json.hasMore));
        setLimit(returnedLimit);
        setOffset(newOffset);

        // parse next href if links provided
        if (Array.isArray(json.links)) {
          const nextLink = json.links.find((l) => l.rel === "next");
          setNextHref(nextLink ? nextLink.href : null);
        } else {
          setNextHref(null);
        }

        return Boolean(json.hasMore);
      } catch (err) {
        if (err.name === "AbortError") {
          // abort is expected on tab changes
          return false;
        }
        setError(err.message || "Failed to fetch pending queries");
        return false;
      } finally {
        setLoading(false);
        setLoadingMore(false);
        abortRef.current = null;
      }
    },
    [cat, pendingWith, nextHref]
  );

  // refresh: clear and fetch first page
  const refresh = useCallback(async () => {
    setData([]);
    setOffset(0);
    setNextHref(null);
    setHasMore(false);
    setError(null);
    return fetchPage({ useNext: false, requestedOffset: 0, append: false });
  }, [fetchPage]);

  // fetch next page (append). Prefer nextHref when present.
  const fetchNextPage = useCallback(async () => {
    if (!pendingWith) return false;
    const useNext = Boolean(nextHref);
    return fetchPage({ useNext, requestedOffset: offset, append: true });
  }, [fetchPage, offset, nextHref, pendingWith]);

  // loadAll: repeatedly fetchNextPage until hasMore=false or guard tripped
  const loadAll = useCallback(async (opts = { maxIterations: 1000 }) => {
    if (!pendingWith) return;
    // ensure first page exists
    if (data.length === 0 && !loading && !loadingMore) {
      await refresh();
    }

    let iterations = 0;
    // loop until hasMore becomes false
    while (true) {
      // safety guard
      if (iterations >= (opts.maxIterations || 1000)) break;
      iterations += 1;

      // if server says no more, break
      if (!hasMore) break;

      const more = await fetchNextPage();
      // if fetchNextPage returns false (error or no more) break
      if (!more) break;
    }
  }, [pendingWith, data.length, loading, loadingMore, hasMore, refresh, fetchNextPage]);

  // Auto-fetch first page when pendingWith changes (including initial mount)
  useEffect(() => {
    if (pendingWith) {
      // kick off first page load
      refresh();
    } else {
      // clear state when pendingWith is null
      setData([]);
      setHasMore(false);
      setOffset(0);
      setNextHref(null);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [pendingWith, refresh]);

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    offset,
    limit,
    fetchNextPage,
    refresh,
    loadAll,
  };
}
