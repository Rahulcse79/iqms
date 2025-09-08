// src/hooks/usePendingQueries.js
import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/pendingQuery";

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

  // Helper: dedupe by doc_id (fallback to sno/imprno)
  const dedupeAndMerge = (prev = [], incoming = []) => {
    const map = new Map();
    const keyFor = (it) =>
      it && (it.doc_id || `${it.sno || ""}-${it.imprno || ""}-${it.subject || ""}`);
    prev.forEach((it) => map.set(keyFor(it), it));
    incoming.forEach((it) => map.set(keyFor(it), it));
    return Array.from(map.values());
  };

  // Core page fetcher. Returns boolean hasMore from server (or false)
  const fetchPage = useCallback(
    async ({ useNextHref = false, requestedOffset = 0, append = false } = {}) => {
      // if no pendingWith (incoming tab) do nothing
      if (!pendingWith) {
        setData([]);
        setHasMore(false);
        setOffset(0);
        setNextHref(null);
        return false;
      }

      // abort any previous fetch
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const signal = controller.signal;

      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        let url;
        if (useNextHref && nextHref) {
          url = nextHref;
        } else {
          // build using offset param
          url = `${API_BASE}/${encodeURIComponent(cat)}/${encodeURIComponent(
            pendingWith
          )}?offset=${requestedOffset}`;
        }

        const resp = await fetch(url, { signal });
        if (!resp.ok) {
          throw new Error(`Server returned ${resp.status}`);
        }
        const json = await resp.json();

        const items = Array.isArray(json.items) ? json.items : [];
        // determine limit returned by API or fallback
        const returnedLimit =
          typeof json.limit === "number" ? json.limit : items.length > 0 ? items.length : 100;

        // update next offset
        const newOffset = requestedOffset + returnedLimit;

        // merge or replace
        setData((prev) => (append ? dedupeAndMerge(prev, items) : items));

        setHasMore(Boolean(json.hasMore));
        setLimit(returnedLimit);
        setOffset(newOffset);

        // parse links array for next href if available
        if (Array.isArray(json.links)) {
          const next = json.links.find((l) => l.rel === "next");
          setNextHref(next ? next.href : null);
        } else {
          setNextHref(null);
        }

        return Boolean(json.hasMore);
      } catch (err) {
        if (err.name === "AbortError") {
          // expected when switching tabs / canceling
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
    // dependencies: only update when cat/pendingWith/nextHref change
    [cat, pendingWith, nextHref]
  );

  // refresh from scratch (offset=0)
  const refresh = useCallback(async () => {
    setData([]);
    setOffset(0);
    setNextHref(null);
    setHasMore(false);
    return fetchPage({ useNextHref: false, requestedOffset: 0, append: false });
  }, [fetchPage]);

  // fetch next page (returns boolean hasMore)
  const fetchNextPage = useCallback(async () => {
    // nothing to do if no pendingWith
    if (!pendingWith) return false;
    // if there is a nextHref prefer it, else use the offset
    const useNext = Boolean(nextHref);
    return fetchPage({ useNextHref: useNext, requestedOffset: offset, append: true });
  }, [fetchPage, offset, nextHref, pendingWith]);

  // auto-fetch first page when pendingWith changes
  useEffect(() => {
    // on tab change or pendingWith change, load first page (if pendingWith exists)
    if (pendingWith) {
      refresh();
    } else {
      // incoming tab -> clear
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
  };
}
