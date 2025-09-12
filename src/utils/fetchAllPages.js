// utils/fetchAllPages.js
import axios from "axios";

export async function fetchAllPages(baseUrl, limit = 200, signal) {
  let offset = 0;
  let allItems = [];
  let hasMore = true;

  while (hasMore) {
    try {
      const { data } = await axios.get(`${baseUrl}?offset=${offset}&limit=${limit}`, { signal });

      const items = data?.items || [];
      allItems = [...allItems, ...items];

      hasMore = Boolean(data?.hasMore);
      offset += limit;
    } catch (err) {
      if (axios.isCancel(err)) throw err; // allow cancellation
      console.error("Paged fetch failed at offset", offset, err.message);
      throw err;
    }
  }

  return allItems;
}
