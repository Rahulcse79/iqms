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
      const { data } = await axios.get(`${baseUrl}?offset=${offset}`, { signal });

      const items = data?.items || [];
      allItems = [...allItems, ...items];

      if (onPage) onPage(items, allItems);

      // Server-driven paging
      hasMore = Boolean(data?.hasMore);

      // Use server-provided limit/offset to advance
      const pageLimit = data?.limit ?? items.length ?? 0;
      offset += pageLimit;

      // Safety: if server forgets to return limit, break to avoid infinite loop
      if (!pageLimit) {
        console.warn("No limit returned by server, stopping paging.");
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
