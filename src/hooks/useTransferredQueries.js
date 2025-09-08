/* ==================================================
   File: src/hooks/useTransferredQueries.js
   Purpose: Custom hook to fetch `transferredQuery` pages
   Features:
     - pagination via offset
     - aborts in-flight requests when switching tabs
     - deduplicates items by doc_id
     - exposes fetchNextPage(), loadAll(), refresh()
     - simple in-memory cache per (cat,pendingWith)
   ==================================================*/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/transferredQuery";
const DEFAULT_PAGE_SIZE = 100;
const CACHE_TTL_MS = 1000 * 60 * 2; // 2 minutes (tunable)

export default function useTransferredQueries(cat = 1, pendingWith, pageSize = DEFAULT_PAGE_SIZE) {
  const cacheRef = useRef(new Map()); // key -> { pages, hasMore, offset, ts }
  const inFlightRef = useRef(null); // AbortController for the current request
  const pendingOffsetsRef = useRef(new Set()); // offsets currently being requested

  const [pages, setPages] = useState([]); // array of pages (each page: array of items)
  const [loading, setLoading] = useState(false); // initial/refresh loading
  const [loadingMore, setLoadingMore] = useState(false); // fetching additional pages
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const cacheKey = `${cat}:${pendingWith}`;

  // Flatten pages but dedupe by doc_id (keep first seen)
  const data = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const page of pages) {
      if (!Array.isArray(page)) continue;
      for (const item of page) {
        const id = item && (item.doc_id ?? item.id ?? item.sno);
        if (id == null) {
          out.push(item);
          continue;
        }
        if (!seen.has(id)) {
          seen.add(id);
          out.push(item);
        }
      }
    }
    return out;
  }, [pages]);

  // build fetch helper
  const fetchPage = useCallback(
    async (offsetToFetch = 0) => {
      if (!pendingWith) {
        return { items: [], hasMore: false, offset: 0 };
      }

      // prevent duplicate simultaneous requests for same offset
      if (pendingOffsetsRef.current.has(offsetToFetch)) {
        return { items: [], hasMore: false, offset: offsetToFetch };
      }

      pendingOffsetsRef.current.add(offsetToFetch);

      // abort previous request (we only allow one inflight fetch at a time for simplicity)
      if (inFlightRef.current) {
        try {
          inFlightRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const ac = new AbortController();
      inFlightRef.current = ac;

      const url = `${API_BASE}/${encodeURIComponent(cat)}/${encodeURIComponent(pendingWith)}?offset=${encodeURIComponent(
        offsetToFetch
      )}`;

      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const json = await res.json();

        const items = Array.isArray(json.items) ? json.items : [];
        const nextOffset = typeof json.offset === "number" ? json.offset : offsetToFetch + items.length;
        const resHasMore = Boolean(json.hasMore);

        pendingOffsetsRef.current.delete(offsetToFetch);
        inFlightRef.current = null;

        return { items, hasMore: resHasMore, offset: nextOffset, raw: json };
      } catch (err) {
        pendingOffsetsRef.current.delete(offsetToFetch);
        inFlightRef.current = null;
        // normalize abort error
        if (err && err.name === "AbortError") {
          throw err; // let caller decide what to do
        }
        throw err;
      }
    },
    [cat, pendingWith]
  );

  // fetch the first page (or use cache)
  useEffect(() => {
    let mounted = true;

    // reset state when pendingWith changes
    setPages([]);
    setError(null);
    setOffset(0);
    setHasMore(false);

    if (!pendingWith) return;

    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      setPages(cached.pages);
      setHasMore(cached.hasMore);
      setOffset(cached.offset ?? cached.pages.reduce((s, p) => s + (Array.isArray(p) ? p.length : 0), 0));
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const first = await fetchPage(0);
        if (!mounted) return;
        setPages([first.items]);
        setHasMore(first.hasMore);
        setOffset(first.offset ?? first.items.length);
        cacheRef.current.set(cacheKey, { pages: [first.items], hasMore: first.hasMore, offset: first.offset ?? 0, ts: Date.now() });
      } catch (err) {
        if (err && err.name === "AbortError") return;
        setError(err ? String(err) : "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (inFlightRef.current) inFlightRef.current.abort();
    };
  }, [cacheKey, fetchPage, pendingWith]);

  // fetch next page (returns boolean -> hasMore after the call)
  const fetchNextPage = useCallback(async () => {
    // compute the next offset as the total items we've loaded (pages flattened length)
    const currentLoaded = pages.reduce((s, p) => s + (Array.isArray(p) ? p.length : 0), 0);
    const nextOffset = currentLoaded;

    // if already no more, return false
    if (!hasMore && currentLoaded > 0) return false;

    setLoadingMore(true);
    try {
      const result = await fetchPage(nextOffset);
      if (result.items && result.items.length > 0) {
        setPages((prev) => {
          const updated = [...prev, result.items];
          // update cache
          cacheRef.current.set(cacheKey, { pages: updated, hasMore: result.hasMore, offset: result.offset ?? nextOffset + result.items.length, ts: Date.now() });
          return updated;
        });
      }
      setHasMore(result.hasMore);
      setOffset(result.offset ?? nextOffset + (result.items ? result.items.length : 0));
      return Boolean(result.hasMore);
    } catch (err) {
      if (err && err.name === "AbortError") return false;
      setError(err ? String(err) : "Unknown error");
      return false;
    } finally {
      setLoadingMore(false);
    }
  }, [cacheKey, fetchPage, hasMore, pages]);

  // Refresh (clear cache for this key and fetch first page again)
  const refresh = useCallback(async () => {
    // abort any inflight
    if (inFlightRef.current) inFlightRef.current.abort();
    cacheRef.current.delete(cacheKey);
    setPages([]);
    setError(null);
    setOffset(0);
    setHasMore(false);

    try {
      setLoading(true);
      const first = await fetchPage(0);
      setPages([first.items]);
      setHasMore(first.hasMore);
      setOffset(first.offset ?? first.items.length);
      cacheRef.current.set(cacheKey, { pages: [first.items], hasMore: first.hasMore, offset: first.offset ?? 0, ts: Date.now() });
    } catch (err) {
      if (err && err.name === "AbortError") return;
      setError(err ? String(err) : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchPage]);

  // Load all pages until hasMore becomes false. Returns final {success, loaded}
  const loadAll = useCallback(async (opts = {}) => {
    // opts can include onProgress(optional function)
    try {
      let keepGoing = true;
      while (keepGoing) {
        const more = await fetchNextPage();
        keepGoing = Boolean(more);
        if (!keepGoing) break;
      }
      return { success: true, loaded: pages.reduce((s,p)=> s + (Array.isArray(p)?p.length:0), 0) };
    } catch (err) {
      return { success: false, error: err ? String(err) : "Unknown" };
    }
  }, [fetchNextPage, pages]);

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    offset,
    fetchNextPage,
    refresh,
    loadAll,
  };
}
