// src/hooks/useIncomingQueries.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/pendingQuery";
const DEFAULT_PAGE_SIZE = 50;
const CACHE_TTL_MS = 1000 * 60 * 2; // 2 minutes

export default function useIncomingQueries(cat = 1, pendingWith, pageSize = DEFAULT_PAGE_SIZE) {
  const cacheRef = useRef(new Map()); // key -> { pages, hasMore, offset, ts }
  const inFlightRef = useRef(null);
  const pendingOffsetsRef = useRef(new Set());

  const [pages, setPages] = useState([]); // array of page arrays
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const cacheKey = `${cat}:${pendingWith}:${pageSize}`;

  // flatten + dedupe by doc_id (first seen kept)
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

  // fetch one page
  const fetchPage = useCallback(
    async (offsetToFetch = 0) => {
      if (!pendingWith) return { items: [], hasMore: false, offset: 0 };

      if (pendingOffsetsRef.current.has(offsetToFetch)) {
        return { items: [], hasMore: false, offset: offsetToFetch };
      }
      pendingOffsetsRef.current.add(offsetToFetch);

      // abort previous
      if (inFlightRef.current) {
        try {
          inFlightRef.current.abort();
        } catch (e) {}
      }
      const ac = new AbortController();
      inFlightRef.current = ac;

      const url = `${API_BASE}/${encodeURIComponent(cat)}/${encodeURIComponent(pendingWith)}?offset=${encodeURIComponent(
        offsetToFetch
      )}&limit=${encodeURIComponent(pageSize)}`;

      try {
        const res = await fetch(url, { signal: ac.signal, credentials: "include" });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const json = await res.json();

        const items = Array.isArray(json.items) ? json.items : [];
        const nextOffset =
          typeof json.offset === "number" ? json.offset : offsetToFetch + (Array.isArray(items) ? items.length : 0);
        const resHasMore = typeof json.hasMore === "boolean" ? json.hasMore : Boolean(items && items.length === pageSize);

        pendingOffsetsRef.current.delete(offsetToFetch);
        inFlightRef.current = null;

        return { items, hasMore: resHasMore, offset: nextOffset, raw: json };
      } catch (err) {
        pendingOffsetsRef.current.delete(offsetToFetch);
        inFlightRef.current = null;
        if (err && err.name === "AbortError") {
          throw err;
        }
        throw err;
      }
    },
    [cat, pendingWith, pageSize]
  );

  // initial fetch or use cache
  useEffect(() => {
    let mounted = true;

    setPages([]);
    setError(null);
    setOffset(0);
    setHasMore(false);

    if (!pendingWith) return;

    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      setPages(cached.pages);
      setHasMore(Boolean(cached.hasMore));
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
        setOffset(first.offset ?? (Array.isArray(first.items) ? first.items.length : 0));
        cacheRef.current.set(cacheKey, {
          pages: [first.items],
          hasMore: first.hasMore,
          offset: first.offset ?? (Array.isArray(first.items) ? first.items.length : 0),
          ts: Date.now(),
        });
      } catch (err) {
        if (err && err.name === "AbortError") return;
        setError(err ? String(err) : "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (inFlightRef.current) {
        try {
          inFlightRef.current.abort();
        } catch (e) {}
      }
    };
  }, [cacheKey, fetchPage, pendingWith]);

  // fetch next page
  const fetchNextPage = useCallback(async () => {
    const currentLoaded = pages.reduce((s, p) => s + (Array.isArray(p) ? p.length : 0), 0);
    const nextOffset = currentLoaded;

    if (!hasMore && currentLoaded > 0) return false;

    setLoadingMore(true);
    try {
      const result = await fetchPage(nextOffset);
      if (result.items && result.items.length > 0) {
        setPages((prev) => {
          const updated = [...prev, result.items];
          cacheRef.current.set(cacheKey, {
            pages: updated,
            hasMore: result.hasMore,
            offset: result.offset ?? nextOffset + result.items.length,
            ts: Date.now(),
          });
          return updated;
        });
      }
      setHasMore(Boolean(result.hasMore));
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

  // refresh
  const refresh = useCallback(async () => {
    if (inFlightRef.current) {
      try {
        inFlightRef.current.abort();
      } catch (e) {}
    }
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
      setOffset(first.offset ?? (Array.isArray(first.items) ? first.items.length : 0));
      cacheRef.current.set(cacheKey, {
        pages: [first.items],
        hasMore: first.hasMore,
        offset: first.offset ?? (Array.isArray(first.items) ? first.items.length : 0),
        ts: Date.now(),
      });
    } catch (err) {
      if (err && err.name === "AbortError") return;
      setError(err ? String(err) : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchPage]);

  // loadAll: sequentially fetch until no more pages
  const loadAll = useCallback(async (opts = {}) => {
    const onProgress = typeof opts.onProgress === "function" ? opts.onProgress : null;
    try {
      let more = true;
      let totalLoaded = pages.reduce((s, p) => s + (Array.isArray(p) ? p.length : 0), 0);

      if (totalLoaded === 0) {
        setLoading(true);
        try {
          const first = await fetchPage(0);
          setPages([first.items]);
          setHasMore(first.hasMore);
          setOffset(first.offset ?? (Array.isArray(first.items) ? first.items.length : 0));
          cacheRef.current.set(cacheKey, {
            pages: [first.items],
            hasMore: first.hasMore,
            offset: first.offset ?? (Array.isArray(first.items) ? first.items.length : 0),
            ts: Date.now(),
          });
          totalLoaded = (Array.isArray(first.items) ? first.items.length : 0);
          if (onProgress) onProgress(totalLoaded);
          more = Boolean(first.hasMore);
        } catch (err) {
          if (err && err.name === "AbortError") return { success: false, error: "Aborted" };
          return { success: false, error: err ? String(err) : "Unknown" };
        } finally {
          setLoading(false);
        }
      }

      // fetch additional pages until done
      while (more) {
        const has = await fetchNextPage();
        totalLoaded = pages.reduce((s, p) => s + (Array.isArray(p) ? p.length : 0), 0);
        if (onProgress) onProgress(totalLoaded);
        more = Boolean(has);
        if (!has) break;
      }

      const finalCount = pages.reduce((s, p) => s + (Array.isArray(p) ? p.length : 0), 0);
      return { success: true, loaded: finalCount };
    } catch (err) {
      return { success: false, error: err ? String(err) : "Unknown" };
    }
  }, [cacheKey, fetchNextPage, fetchPage, pages]);

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
