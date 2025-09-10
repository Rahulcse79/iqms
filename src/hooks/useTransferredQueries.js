import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/transferredQuery";

/**
 * useTransferredQueries(cat, pendingWith)
 *
 * - Same design as usePendingQueries
 * - Auto-fetch first page on mount/tab change
 * - Supports offset & links.next
 * - Dedupes by doc_id
 * - Safe aborts on tab switch/unmount
 */
export default function useTransferredQueries(cat = 1, pendingWith = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(100);

  const nextHrefRef = useRef(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // dedupe helper
  const keyFor = (it) =>
    it &&
    (it.doc_id || `${it.sno || ""}-${it.imprno || ""}-${it.subject || ""}`);

  const dedupeAndMerge = (prev = [], incoming = []) => {
    const map = new Map();
    prev.forEach((it) => map.set(keyFor(it), it));
    incoming.forEach((it) => map.set(keyFor(it), it));
    return Array.from(map.values());
  };

  const fetchPage = useCallback(
    async ({ useNext = false, requestedOffset = 0, append = false } = {}) => {
      if (!pendingWith) {
        setData([]);
        setHasMore(false);
        setOffset(0);
        setLimit(100);
        nextHrefRef.current = null;
        return false;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const signal = controller.signal;

      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        let url;
        if (useNext && nextHrefRef.current) {
          url = nextHrefRef.current;
        } else {
          const o = Number.isFinite(requestedOffset) ? requestedOffset : 0;
          url = `${API_BASE}/${encodeURIComponent(cat)}/${encodeURIComponent(
            pendingWith
          )}?offset=${o}`;
        }

        const resp = await fetch(url, { signal });
        if (!resp.ok) throw new Error(`Server returned ${resp.status}`);

        const json = await resp.json();
        const items = Array.isArray(json.items) ? json.items : [];

        const returnedLimit =
          typeof json.limit === "number" ? json.limit : items.length || 100;

        const newOffset =
          (Number.isFinite(requestedOffset) ? requestedOffset : 0) +
          returnedLimit;

        if (!mountedRef.current) return false;
        setData((prev) => (append ? dedupeAndMerge(prev, items) : items));
        setHasMore(Boolean(json.hasMore));
        setLimit(returnedLimit);
        setOffset(newOffset);

        if (Array.isArray(json.links)) {
          const nextLink = json.links.find((l) => l.rel === "next");
          nextHrefRef.current = nextLink ? nextLink.href : null;
        } else {
          nextHrefRef.current = json.nextHref || null;
        }

        return Boolean(json.hasMore);
      } catch (err) {
        if (err.name === "AbortError") return false;
        if (!mountedRef.current) return false;
        setError(err.message || "Failed to fetch transferred queries");
        return false;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [cat, pendingWith]
  );

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return false;
    setData([]);
    setOffset(0);
    nextHrefRef.current = null;
    setHasMore(false);
    setError(null);
    return fetchPage({ useNext: false, requestedOffset: 0, append: false });
  }, [fetchPage]);

  const fetchNextPage = useCallback(async () => {
    if (!pendingWith) return false;
    const useNext = Boolean(nextHrefRef.current);
    return fetchPage({ useNext, requestedOffset: offset, append: true });
  }, [fetchPage, offset, pendingWith]);

  const loadAll = useCallback(
    async (opts = { maxIterations: 1000 }) => {
      if (!pendingWith) return;
      if (
        (data.length === 0 && !loading && !loadingMore) ||
        (!hasMore && data.length === 0)
      ) {
        await refresh();
      }

      let iterations = 0;
      const maxIter = opts?.maxIterations ?? 1000;

      while (mountedRef.current) {
        if (iterations >= maxIter) break;
        iterations += 1;
        if (!hasMore) break;
        const more = await fetchNextPage();
        if (!more) break;
      }
    },
    [
      pendingWith,
      data.length,
      loading,
      loadingMore,
      hasMore,
      refresh,
      fetchNextPage,
    ]
  );

  useEffect(() => {
    if (pendingWith) {
      refresh();
    } else {
      setData([]);
      setHasMore(false);
      setOffset(0);
      nextHrefRef.current = null;
      setError(null);
      setLoading(false);
      setLoadingMore(false);
    }
    return () => abortRef.current?.abort();
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
