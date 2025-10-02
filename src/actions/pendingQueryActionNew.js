// pendingQueryActionNew.js - COMPLETE REWRITE FOR NEW API
import {
  PENDING_QUERY_REQUEST,
  PENDING_QUERY_SUCCESS,
  PENDING_QUERY_FAIL,
} from "../constants/appConstants";

const PENDING_STORAGE_KEY_NEW = "pendingQueries_v2_new";
const API_ENDPOINT = "http://175.25.5.7/API/controller.php?ivrsIqmsListing";
const API_TOKEN = "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS";

// Safe storage operations
function safeLoadPendingStorageNew() {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY_NEW);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read PENDING storage (NEW):", e);
    return {};
  }
}

function safeSavePendingToStorageNew(pendingWith, items) {
  try {
    const store = safeLoadPendingStorageNew();
    store[pendingWith] = items || [];
    localStorage.setItem(PENDING_STORAGE_KEY_NEW, JSON.stringify(store));

    // Trigger custom event for live updates
    window.dispatchEvent(
      new CustomEvent("pendingQueriesUpdated", {
        detail: { pendingWith, count: items?.length || 0 },
      })
    );
  } catch (e) {
    console.warn("Failed to save PENDING to storage (NEW):", e);
  }
}

/**
 * Generate PEN_WITH code based on active role and level
 * @param {Object} activeRole - Active role object
 * @param {string} level - "1" for creator, "2" for verifier, "3" for approver
 * @returns {string} - Formatted PEN_WITH code (e.g., "U1A", "U2C", "U3O")
 */
export const generatePenWithCode = (activeRole, level) => {
  if (!activeRole || !level) {
    console.warn("Missing activeRole or level for PEN_WITH generation");
    return `U${level || "1"}`; // Fallback with level if available
  }

  const moduleToSuffix = {
    APW: "A",
    CPW: "C",
    OPW: "O",
    EDP: "", // no suffix for EDP
  };

  const suffix = moduleToSuffix[activeRole.MODULE] || "";
  const penWith = `U${level}${suffix}`;

  console.log(
    `📝 Generated PEN_WITH: ${penWith} for module: ${activeRole.MODULE}, level: ${level}`
  );
  return penWith;
};

/**
 * Format cell allocation for API
 * @param {string} cellAlloted - Cell allocation string from activeRole
 * @returns {string} - Formatted cell string for API
 */
export const formatCellAllocation = (cellAlloted) => {
  if (!cellAlloted) return "'ALL'";

  // If already formatted with quotes, return as is
  if (cellAlloted.includes("'")) return cellAlloted;

  // Split by comma and wrap each in quotes
  const cells = cellAlloted.split(",").map((cell) => cell.trim());
  const formatted = cells.map((cell) => `'${cell}'`).join(",");

  console.log(`📝 Formatted cells: ${cellAlloted} -> ${formatted}`);
  return formatted;
};

/**
 * NEW API: Fetch pending queries using the updated ivrsIqmsListing API
 * @param {Object} params - API parameters
 * @param {Object} params.activeRole - Active role object
 * @param {string} params.level - Role level ("1", "2", "3")
 */
export const fetchPendingQueriesNew =
  ({ activeRole, level }) =>
  async (dispatch) => {
    if (!activeRole) {
      const errorMsg = "fetchPendingQueriesNew called without an activeRole.";
      console.error(`❌ ${errorMsg}`);
      dispatch({ type: PENDING_QUERY_FAIL, payload: errorMsg });
      return; // Stop execution
    }
    const penWith = generatePenWithCode(activeRole, level);

    dispatch({
      type: PENDING_QUERY_REQUEST,
      meta: {
        pendingWith: penWith,
        apiVersion: "NEW",
        level,
        activeRole: activeRole?.PORTFOLIO_NAME,
      },
    });

    try {
      console.log(`🔄 Fetching pending queries (NEW API) for ${penWith}:`, {
        module: activeRole.MODULE,
        subSection: activeRole.SUB_SECTION,
        level,
      });

      const requestBody = {
        queryType: "PENDING_QUERY",
        MODULE_CAT: String(activeRole.MODULE_CAT),
        PEN_WITH: penWith,
        SUB_SECTION: activeRole.SUB_SECTION,
        CELL: formatCellAllocation(activeRole.CELL_ALLOTED),
        api_token: API_TOKEN,
      };

      console.log("📤 API Request body:", requestBody);

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
      console.log(
        `✅ Pending queries (NEW API) response for ${penWith}:`,
        data
      );

      // Handle the response structure - data should be in 'data' field
      const items = data?.data || [];

      // Validate response structure
      if (data.success === false) {
        console.warn(`⚠️ API returned success=false for ${penWith}:`, data);
      }

      // Save to storage and dispatch success
      safeSavePendingToStorageNew(penWith, items);

      dispatch({
        type: PENDING_QUERY_SUCCESS,
        payload: { pendingWith: penWith, items: [...items] },
        meta: {
          apiVersion: "NEW",
          level,
          activeRole: activeRole?.PORTFOLIO_NAME,
          responseSuccess: data.success,
        },
      });

      console.log(
        `✅ Successfully processed ${items.length} pending queries for ${penWith}`
      );
      return { pendingWith: penWith, items: items, apiVersion: "NEW", level };
    } catch (error) {
      console.error(
        `❌ Failed to fetch pending queries (NEW API) for ${penWith}:`,
        error
      );

      dispatch({
        type: PENDING_QUERY_FAIL,
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
 * Fetch all pending queries for an active role (creator, verifier, approver)
 * @param {Object} activeRole - Active role object
 */
export const fetchAllPendingQueriesForRole =
  (activeRole) => async (dispatch) => {
    if (!activeRole) {
      console.error("❌ No active role provided for pending queries fetch");
      return { success: false, error: "No active role" };
    }

    console.log(
      `🚀 Fetching all pending queries for role: ${activeRole.PORTFOLIO_NAME}`
    );

    const levels = ["1", "2", "3"]; // creator, verifier, approver
    const results = [];

    try {
      // Fetch all three levels in parallel
      const fetchPromises = levels.map((level) =>
        dispatch(fetchPendingQueriesNew({ activeRole, level }))
      );

      const responses = await Promise.allSettled(fetchPromises);

      responses.forEach((response, index) => {
        const level = levels[index];
        const penWith = generatePenWithCode(activeRole, level);

        if (response.status === "fulfilled") {
          console.log(
            `✅ Level ${level} (${penWith}): ${response.value.items.length} queries`
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
        `📊 Pending queries fetch completed: ${successful}/${levels.length} successful`
      );

      return {
        success: successful > 0,
        results,
        successful,
        failed,
        activeRole: activeRole?.PORTFOLIO_NAME,
      };
    } catch (error) {
      console.error("❌ Critical error fetching all pending queries:", error);
      return {
        success: false,
        error: error.message,
        activeRole: activeRole?.PORTFOLIO_NAME,
      };
    }
  };

/**
 * Refresh pending queries for specific level
 */
export const refreshPendingQueriesNew =
  ({ activeRole, level }) =>
  async (dispatch) => {
    const penWith = generatePenWithCode(activeRole, level);
    console.log(`🔄 Refreshing pending queries (NEW API) for: ${penWith}`);

    // Clear existing data first
    safeSavePendingToStorageNew(penWith, []);

    // Fetch fresh data
    return dispatch(fetchPendingQueriesNew({ activeRole, level }));
  };

/**
 * Load pending queries from storage
 */
export const loadPendingQueriesFromStorageNew = (pendingWith) => (dispatch) => {
  try {
    const store = safeLoadPendingStorageNew();
    const items = store[pendingWith] || [];

    console.log(
      `📦 Loading pending queries (NEW API) from storage for ${pendingWith}: ${items.length} items`
    );

    dispatch({
      type: PENDING_QUERY_SUCCESS,
      payload: { pendingWith: pendingWith, items: [...items] },
      meta: {
        apiVersion: "NEW",
      },
    });

    return {
      pendingWith: pendingWith,
      items: items,
      fromStorage: true,
      apiVersion: "NEW",
    };
  } catch (error) {
    console.error(
      "❌ Failed to load pending queries (NEW API) from storage:",
      error
    );

    dispatch({
      type: PENDING_QUERY_FAIL,
      payload: "Failed to load from storage: " + error?.message,
      meta: { pendingWith: pendingWith, apiVersion: "NEW" },
    });

    throw error;
  }
};

/**
 * Get pending queries count from storage
 */
export const getPendingQueriesCountNew = (pendingWith) => {
  try {
    const store = safeLoadPendingStorageNew();
    const items = store[pendingWith] || [];
    return items.length;
  } catch (error) {
    console.warn("Failed to get pending queries count (NEW API):", error);
    return 0;
  }
};

/**
 * Get all pending counts by level from storage
 * @param {Object} activeRole - Active role object
 * @returns {Object} - Count object with creator, verifier, approver, total
 */
export const getAllPendingCountsForRole = (activeRole) => {
  if (!activeRole) return { creator: 0, verifier: 0, approver: 0, total: 0 };

  try {
    const creator = getPendingQueriesCountNew(
      generatePenWithCode(activeRole, "1")
    );
    const verifier = getPendingQueriesCountNew(
      generatePenWithCode(activeRole, "2")
    );
    const approver = getPendingQueriesCountNew(
      generatePenWithCode(activeRole, "3")
    );

    return {
      creator,
      verifier,
      approver,
      total: creator + verifier + approver,
    };
  } catch (error) {
    console.warn("Failed to get all pending counts:", error);
    return { creator: 0, verifier: 0, approver: 0, total: 0 };
  }
};

/**
 * Clear all pending queries from storage
 */
export const clearPendingQueriesStorageNew = () => {
  try {
    localStorage.removeItem(PENDING_STORAGE_KEY_NEW);
    console.log("🗑️ Cleared pending queries storage (NEW API)");

    // Trigger update event
    window.dispatchEvent(
      new CustomEvent("pendingQueriesUpdated", {
        detail: { cleared: true },
      })
    );
  } catch (error) {
    console.warn("Failed to clear pending queries storage (NEW API):", error);
  }
};
