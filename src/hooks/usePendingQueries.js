// src/hooks/usePendingQueries.js
import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/pendingQuery";

/**
 * usePendingQueries(cat, pendingWith)
 *
 * - auto-fetches first page whenever pendingWith changes (including mount)
 * - exposes fetchNextPage(), refresh(), and loadAll()
 * - supports links.next.href or offset+limit strategy
 * - aborts in-flight requests on tab change or unmount
 *
 * Key fixes vs original:
 * - avoid dependency loop by storing nextHref in a ref (nextHrefRef)
 * - keep fetchPage stable w/o including nextHref in deps
 * - guard setState after unmount
 * - explicit error values and booleans returned from fetchPage/fetchNextPage
 */
export default function usePendingQueries(cat = 1, pendingWith = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // initial page load
  const [loadingMore, setLoadingMore] = useState(false); // "show more" loads
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(100);

  // keep last nextHref in ref so fetchPage doesn't have to list it in deps
  const nextHrefRef = useRef(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // abort any in-flight request on unmount
      try {
        abortRef.current?.abort();
      } catch (e) {}
    };
  }, []);

  // Build a dedupe map by doc_id (fallback)
  const keyFor = (it) =>
    it && (it.doc_id || `${it.sno || ""}-${it.imprno || ""}-${it.subject || ""}`);

  const dedupeAndMerge = (prev = [], incoming = []) => {
    const map = new Map();
    prev.forEach((it) => map.set(keyFor(it), it));
    incoming.forEach((it) => map.set(keyFor(it), it));
    return Array.from(map.values());
  };

  // Core page fetcher (stable identity: deps only on cat + pendingWith)
  const fetchPage = useCallback(
    async ({ useNext = false, requestedOffset = 0, append = false } = {}) => {
      // if pendingWith falsy -> nothing to do
      if (!pendingWith) {
        if (!mountedRef.current) return false;
        // clear states
        setData([]);
        setHasMore(false);
        setOffset(0);
        setLimit(100);
        nextHrefRef.current = null;
        return false;
      }

      // abort previous request
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
        if (useNext && nextHrefRef.current) {
          url = nextHrefRef.current;
        } else {
          // ensure offset is numeric
          const o = Number.isFinite(requestedOffset) ? requestedOffset : 0;
          url = `${API_BASE}/${encodeURIComponent(cat)}/${encodeURIComponent(
            pendingWith
          )}?offset=${o}`;
        }

        const resp = await fetch(url, { signal });
        if (!resp.ok) throw new Error(`Server returned ${resp.status}`);

        const json = await resp.json();

        const items = Array.isArray(json.items) ? json.items : [];

        // compute returned limit (fallback)
        const returnedLimit =
          typeof json.limit === "number" ? json.limit : items.length > 0 ? items.length : 100;

        const newOffset = (Number.isFinite(requestedOffset) ? requestedOffset : 0) + returnedLimit;

        // merge or replace
        if (!mountedRef.current) return false;
        setData((prev) => (append ? dedupeAndMerge(prev, items) : items));

        // set pagination flags
        setHasMore(Boolean(json.hasMore));
        setLimit(returnedLimit);
        setOffset(newOffset);

        // parse next href if links provided
        if (Array.isArray(json.links)) {
          const nextLink = json.links.find((l) => l.rel === "next");
          nextHrefRef.current = nextLink ? nextLink.href : null;
        } else {
          // if server provided next as href in other ways, try json.nextHref
          nextHrefRef.current = json.nextHref || null;
        }

        // return json.hasMore as boolean
        return Boolean(json.hasMore);
      } catch (err) {
        if (err.name === "AbortError") {
          // abort expected on tab changes/unmount
          return false;
        }
        if (!mountedRef.current) return false;
        setError(err.message || "Failed to fetch pending queries");
        return false;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        // clear ref if same controller
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    // intentionally exclude nextHrefRef from deps
    [cat, pendingWith]
  );

  // refresh: clear and fetch first page
  const refresh = useCallback(async () => {
    // reset local pagination state before requesting
    if (!mountedRef.current) return false;
    setData([]);
    setOffset(0);
    nextHrefRef.current = null;
    setHasMore(false);
    setError(null);
    return fetchPage({ useNext: false, requestedOffset: 0, append: false });
  }, [fetchPage]);

  // fetch next page (append). Prefer nextHrefRef when present.
  const fetchNextPage = useCallback(async () => {
    if (!pendingWith) return false;
    const useNext = Boolean(nextHrefRef.current);
    // use current offset (the hook manages offset)
    return fetchPage({ useNext, requestedOffset: offset, append: true });
  }, [fetchPage, offset, pendingWith]);

  // loadAll: repeatedly fetchNextPage until hasMore=false or guard tripped
  const loadAll = useCallback(
    async (opts = { maxIterations: 1000 }) => {
      if (!pendingWith) return;
      // ensure first page exists
      if ((data.length === 0 && !loading && !loadingMore) || (!hasMore && data.length === 0)) {
        await refresh();
      }

      let iterations = 0;
      const maxIter = opts?.maxIterations ?? 1000;

      // loop until server indicates no more or guard tripped
      while (mountedRef.current) {
        if (iterations >= maxIter) break;
        iterations += 1;

        // if server says no more, break
        if (!hasMore) break;

        const more = await fetchNextPage();
        if (!more) break;
      }
    },
    // use values captured from hook state; keep deps minimal
    [pendingWith, data.length, loading, loadingMore, hasMore, refresh, fetchNextPage]
  );

  // auto-fetch first page when pendingWith changes (including initial mount)
  useEffect(() => {
    // only refresh on a real pendingWith (not null/undefined/empty)
    if (pendingWith) {
      // kick off first page load
      // call but don't block the effect
      refresh();
    } else {
      // clear state when pendingWith is falsy
      setData([]);
      setHasMore(false);
      setOffset(0);
      nextHrefRef.current = null;
      setError(null);
      setLoading(false);
      setLoadingMore(false);
    }

    // abort on pendingWith change
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingWith, refresh]); // refresh is stable because it depends on fetchPage; fetchPage depends only on cat+pendingWith

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
    // optionally expose nextHref for debugging
    _debug_nextHref: () => nextHrefRef.current,
  };
}
