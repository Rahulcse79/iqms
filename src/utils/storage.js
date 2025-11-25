// storage.js
import { set as idbSet, get as idbGet } from 'idb-keyval';

// Async versions for large data
export async function saveRepliedQueries(items) {
  try {
    await idbSet('repliedQueries', items); // any size
  } catch (e) {
    console.warn("Could not persist replied queries", e);
  }
}

export async function loadRepliedQueries() {
  try {
    return (await idbGet('repliedQueries')) || [];
  } catch (e) {
    console.warn("Could not load replied queries", e);
    return [];
  }
}
