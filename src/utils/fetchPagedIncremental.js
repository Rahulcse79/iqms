// utils/fetchPagedIncremental.js
import axios from "axios";

/**
 * Incremental page fetcher that respects server's limit/offset.
 * - Calls `onPage(items, allItems)` after each page
 * - Stops when server says hasMore = false
 */
export async function fetchPagedIncremental(baseUrl, { signal, onPage } = {}) {
  let offset = 0;
  let allItems = [];
  let hasMore = true;

  while (hasMore) {
    try {
      // Request the page (don't send hardcoded limit)
      const { data } = await axios.get(`${baseUrl}?offset=${offset}`, {
        signal,
      });

      const items = data?.items || [];
      allItems = [...allItems, ...items];

      if (typeof onPage === "function") {
        try {
          onPage(items, allItems);
        } catch (cbErr) {
          console.warn("onPage callback error", cbErr);
        }
      }

      // Server-driven paging
      hasMore = Boolean(data?.hasMore);

      // Use server-provided limit/offset to advance
      const pageLimit = Number.isFinite(data?.limit) ? data.limit : items.length || 0;
      offset += pageLimit;

      if (!pageLimit) {
        console.warn("No page limit returned by server; stopping incremental fetch to avoid infinite loop.");
        break;
      }
      
    } catch (err) {
      if (axios.isCancel(err)) throw err;
      console.error("Paged fetch failed at offset", offset, err.message);
      throw err;
    }
  }

  return allItems;
}
