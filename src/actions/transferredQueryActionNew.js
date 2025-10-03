// transferredQueryActionNew.js - COMPLETE REWRITE FOR NEW API
import {
  TRANSFERRED_QUERY_REQUEST,
  TRANSFERRED_SUCCESS,
  TRANSFERRED_FAIL,
} from "../constants/appConstants";

const TRANSFERRED_STORAGE_KEY_NEW = "transferredQueries_v2_new";
const API_ENDPOINT = "http://175.25.5.7/API/controller.php?ivrsIqmsListing";
const API_TOKEN = "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS";

// Safe storage operations
function safeLoadTransferredStorageNew() {
  try {
    const raw = localStorage.getItem(TRANSFERRED_STORAGE_KEY_NEW);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read TRANSFERRED storage (NEW):", e);
    return {};
  }
}

function safeSaveTransferredToStorageNew(pendingWith, items) {
  try {
    const store = safeLoadTransferredStorageNew();
    store[pendingWith] = items || [];
    localStorage.setItem(TRANSFERRED_STORAGE_KEY_NEW, JSON.stringify(store));

    // Trigger custom event for live updates
    window.dispatchEvent(
      new CustomEvent("transferredQueriesUpdated", {
        detail: { pendingWith, count: items?.length || 0 },
      })
    );
  } catch (e) {
    console.warn("Failed to save TRANSFERRED to storage (NEW):", e);
  }
}

/**
 * Generate PEN_WITH code for transferred queries based on designation flag and level
 * @param {string} designationFlag - Base designation flag (e.g., "A2A", "A3O", "A1")
 * @param {string} level - "1" for creator, "2" for verifier, "3" for approver
 * @returns {string} - Formatted PEN_WITH code
 */
export const generateTransferredPenWithCode = (designationFlag, level) => {
  if (!designationFlag || !level) {
    console.warn(
      "Missing designationFlag or level for transferred PEN_WITH generation"
    );
    return "A1A"; // fallback
  }

  // Extract the base and suffix from designation flag
  // Examples: A2A -> base="A", suffix="A"; A3O -> base="A", suffix="O"; A1 -> base="A", suffix=""
  const match = designationFlag.match(/^([A-Z])(\d)?([A-Z]?)$/);
  if (!match) {
    console.warn("Invalid designation flag format:", designationFlag);
    return "A1A"; // fallback
  }

  const [, prefix, , suffix] = match;
  const penWith = `${prefix}${level}${suffix}`;

  console.log(
    `📝 Generated transferred PEN_WITH: ${penWith} from flag: ${designationFlag}, level: ${level}`
  );
  return penWith;
};

/**
 * Format cell allocation for API
 * @param {string} cellAlloted - Cell allocation string from activeRole
 * @returns {string} - Formatted cell string for API
 */
export const formatCellAllocation = (cellAlloted) => {
  if (!cellAlloted) return "";

  // If already formatted with quotes, return as is
  if (cellAlloted.includes("'")) return cellAlloted;

  // Split by comma and wrap each in quotes
  const cells = cellAlloted.split(",").map((cell) => cell.trim());
  const formatted = cells.map((cell) => `'${cell}'`).join(",");

  console.log(
    `📝 Formatted cells for transferred: ${cellAlloted} -> ${formatted}`
  );
  return formatted;
};

/**
 * NEW API: Fetch transferred queries for a specific PEN_WITH code
 * @param {Object} params - API parameters
 * @param {Object} params.activeRole - Active role object
 * @param {string} params.designationFlag - Designation flag (e.g., "A2A")
 * @param {string} params.level - Role level ("1", "2", "3")
 */
export const fetchTransferredQueriesNew =
  ({ activeRole, designationFlag, level }) =>
  async (dispatch) => {
    const penWith = generateTransferredPenWithCode(designationFlag, level);

    dispatch({
      type: TRANSFERRED_QUERY_REQUEST,
      meta: {
        pendingWith: penWith,
        apiVersion: "NEW",
        level,
        activeRole: activeRole?.PORTFOLIO_NAME,
      },
    });

    try {
      console.log(`🔄 Fetching transferred queries (NEW API) for ${penWith}:`, {
        designationFlag,
        level,
        module: activeRole.MODULE,
      });

      const requestBody = {
        queryType: "TRANSFER_QUERY",
        MODULE_CAT: String(activeRole.MODULE_CAT),
        PEN_WITH: penWith,
        CELL: formatCellAllocation(activeRole.CELL_ALLOTED),
        api_token: API_TOKEN,
      };

      console.log("📤 Transferred API Request body:", requestBody);

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        timeout: 30000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let items = [];

      if (data.success && Array.isArray(data.data)) {
        // ✅ Success and data is valid array
        items = data.data;
        console.log(
          `✅ Fetched ${items.length} replied queries (NEW API) for ${activeRole.SUB_SECTION}`
        );
      } else {
        // ❌ Failure or unexpected data format
        console.warn("⚠️ API responded with no data or error:", data);

        // Optional: you could show a notification, or handle empty display
        items = []; // Set to empty array to clear previous entries
      }

      // Save to storage and dispatch success
      safeSaveTransferredToStorageNew(penWith, items);

      dispatch({
        type: TRANSFERRED_SUCCESS,
        payload: { pendingWith: penWith, items: [...items] },
        meta: {
          apiVersion: "NEW",
          level,
          activeRole: activeRole?.PORTFOLIO_NAME,
          responseSuccess: data.success,
        },
      });

      console.log(
        `✅ Successfully processed ${items.length} transferred queries for ${penWith}`
      );
      return { pendingWith: penWith, items: items, apiVersion: "NEW", level };
    } catch (error) {
      console.error(
        `❌ Failed to fetch transferred queries (NEW API) for ${penWith}:`,
        error
      );

      dispatch({
        type: TRANSFERRED_FAIL,
        payload: error?.message || String(error),
        meta: {
          pendingWith: penWith,
          apiVersion: "NEW",
          level,
          activeRole: activeRole?.PORTFOLIO_NAME,
        },
      });

      throw error;
    }
  };

/**
 * Fetch all transferred queries for an active role based on designation flags
 * @param {Object} activeRole - Active role object
 * @param {Array} designationFlags - Array of designation flags
 */
export const fetchAllTransferredQueriesForRole =
  (activeRole, designationFlags) => async (dispatch) => {
    if (!activeRole) {
      console.error("❌ No active role provided for transferred queries fetch");
      return { success: false, error: "No active role" };
    }

    // If no designation flags, skip transferred queries (as per requirement)
    if (!designationFlags || designationFlags.length === 0) {
      console.warn(
        "⚠️ No designation flags provided, skipping transferred queries fetch"
      );
      return {
        success: true,
        results: [],
        successful: 0,
        failed: 0,
        activeRole: activeRole.PORTFOLIO_NAME,
        skipped: true,
      };
    }

    console.log(
      `🚀 Fetching all transferred queries for role: ${activeRole.PORTFOLIO_NAME}`
    );
    console.log(`📋 Using designation flags: ${designationFlags.join(", ")}`);

    const levels = ["1", "2", "3"]; // creator, verifier, approver
    const results = [];

    try {
      // Take the first valid designation flag as base
      const baseFlag = designationFlags[0];
      console.log(`📌 Using base designation flag: ${baseFlag}`);

      // Fetch all three levels (A1X, A2X, A3X) based on the base flag pattern
      const fetchPromises = levels.map((level) =>
        dispatch(
          fetchTransferredQueriesNew({
            activeRole,
            designationFlag: baseFlag,
            level,
          })
        )
      );

      const responses = await Promise.allSettled(fetchPromises);

      responses.forEach((response, index) => {
        const level = levels[index];
        const penWith = generateTransferredPenWithCode(baseFlag, level);

        if (response.status === "fulfilled") {
          console.log(
            `✅ Level ${level} (${penWith}): ${response.value.items.length} transferred queries`
          );
          results.push({
            level,
            penWith,
            success: true,
            count: response.value.items.length,
          });
        } else {
          console.error(
            `❌ Level ${level} (${penWith}) failed:`,
            response.reason
          );
          results.push({
            level,
            penWith,
            success: false,
            error: response.reason,
          });
        }
      });

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(
        `📊 Transferred queries fetch completed: ${successful}/${levels.length} successful`
      );

      return {
        success: successful > 0,
        results,
        successful,
        failed,
        activeRole: activeRole.PORTFOLIO_NAME,
        baseDesignationFlag: baseFlag,
      };
    } catch (error) {
      console.error(
        "❌ Critical error fetching all transferred queries:",
        error
      );
      return {
        success: false,
        error: error.message,
        activeRole: activeRole.PORTFOLIO_NAME,
      };
    }
  };

/**
 * Refresh transferred queries for specific level
 */
export const refreshTransferredQueriesNew =
  ({ activeRole, designationFlag, level }) =>
  async (dispatch) => {
    const penWith = generateTransferredPenWithCode(designationFlag, level);
    console.log(`🔄 Refreshing transferred queries (NEW API) for: ${penWith}`);

    // Clear existing data first
    safeSaveTransferredToStorageNew(penWith, []);

    // Fetch fresh data
    return dispatch(
      fetchTransferredQueriesNew({ activeRole, designationFlag, level })
    );
  };

/**
 * Load transferred queries from storage
 */
export const loadTransferredQueriesFromStorageNew =
  (pendingWith) => (dispatch) => {
    try {
      const store = safeLoadTransferredStorageNew();
      const items = store[pendingWith] || [];

      console.log(
        `📦 Loading transferred queries (NEW API) from storage for ${pendingWith}: ${items.length} items`
      );

      dispatch({
        type: TRANSFERRED_SUCCESS,
        payload: { pendingWith: pendingWith, items: [...items] },
        meta: { fromStorage: true, apiVersion: "NEW" },
      });

      return {
        pendingWith: pendingWith,
        items: items,
        fromStorage: true,
        apiVersion: "NEW",
      };
    } catch (error) {
      console.error(
        "❌ Failed to load transferred queries (NEW API) from storage:",
        error
      );

      dispatch({
        type: TRANSFERRED_FAIL,
        payload: "Failed to load from storage: " + error?.message,
        meta: { pendingWith: pendingWith, apiVersion: "NEW" },
      });

      throw error;
    }
  };

/**
 * Get transferred queries count from storage
 */
export const getTransferredQueriesCountNew = (pendingWith) => {
  try {
    const store = safeLoadTransferredStorageNew();
    const items = store[pendingWith] || [];
    return items.length;
  } catch (error) {
    console.warn("Failed to get transferred queries count (NEW API):", error);
    return 0;
  }
};

/**
 * Get all transferred counts by level from storage
 * @param {Object} activeRole - Active role object
 * @param {Array} designationFlags - Array of designation flags
 * @returns {Object} - Count object with creator, verifier, approver, total
 */
export const getAllTransferredCountsForRole = (
  activeRole,
  designationFlags
) => {
  if (!activeRole || !designationFlags || designationFlags.length === 0) {
    return { creator: 0, verifier: 0, approver: 0, total: 0 };
  }

  try {
    const baseFlag = designationFlags[0];
    const creator = getTransferredQueriesCountNew(
      generateTransferredPenWithCode(baseFlag, "1")
    );
    const verifier = getTransferredQueriesCountNew(
      generateTransferredPenWithCode(baseFlag, "2")
    );
    const approver = getTransferredQueriesCountNew(
      generateTransferredPenWithCode(baseFlag, "3")
    );

    return {
      creator,
      verifier,
      approver,
      total: creator + verifier + approver,
    };
  } catch (error) {
    console.warn("Failed to get all transferred counts:", error);
    return { creator: 0, verifier: 0, approver: 0, total: 0 };
  }
};

/**
 * Clear all transferred queries from storage
 */
export const clearTransferredQueriesStorageNew = () => {
  try {
    localStorage.removeItem(TRANSFERRED_STORAGE_KEY_NEW);
    console.log("🗑️ Cleared transferred queries storage (NEW API)");

    // Trigger update event
    window.dispatchEvent(
      new CustomEvent("transferredQueriesUpdated", {
        detail: { cleared: true },
      })
    );
  } catch (error) {
    console.warn(
      "Failed to clear transferred queries storage (NEW API):",
      error
    );
  }
};

export const refreshAllTransferredQueriesForRole =
  (activeRole, designationFlags) => async (dispatch) => {
    console.log(
      `🔄 Refreshing ALL transferred queries for role: ${activeRole.PORTFOLIO_NAME}`
    );

    if (!designationFlags || designationFlags.length === 0) {
      console.warn("⚠️ No designation flags provided for refresh");
      return { success: false, error: "No designation flags" };
    }

    try {
      // Clear all existing data first
      localStorage.removeItem(TRANSFERRED_STORAGE_KEY_NEW);

      // Call the existing fetchAllTransferredQueriesForRole
      const result = await dispatch(
        fetchAllTransferredQueriesForRole(activeRole, designationFlags)
      );

      console.log("✅ Refresh all transferred queries completed:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to refresh all transferred queries:", error);
      throw error;
    }
  };
