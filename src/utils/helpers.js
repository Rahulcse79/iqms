// Helper functions can be placed here
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

/**
 * Fetches all queries based on active role configuration
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} config - Configuration object
 * @param {Object} [config.activeRole] - Active role object with SUB_SECTION, MODULE, etc.
 * @param {number} [config.cat] - Category code (fallback if activeRole not provided)
 * @param {string} [config.suffix] - Department suffix (fallback if activeRole not provided)
 * @param {string} [config.deptPrefix] - Department prefix (default: calculated from SUB_SECTION)
 * @param {Array} [config.roleDigits=["1", "2", "3"]] - Role digits for creator, verifier, approver
 * @param {Function} [config.onProgress] - Progress callback function
 * @param {Function} [config.onError] - Error callback function
 * @returns {Promise<Object>} - Promise resolving to fetch results
 */
export const fetchAllUserQueries = async (dispatch, config) => {
  const {
    activeRole,
    cat,
    suffix,
    deptPrefix,
    roleDigits = ["1", "2", "3"],
    onProgress,
    onError,
  } = config;

  // Lazy import to avoid circular dependencies
  const { fetchRepliedQueries } = await import("../actions/repliedQueryAction");
  const { fetchPendingQueries } = await import("../actions/pendingQueryAction");
  const { fetchTransferredQueries } = await import(
    "../actions/transferredQueryAction"
  );

  // Import enum functions
  const {
    generateApiCodeFromRole,
    getAllRoleLevelCodes,
    ModuleMapping,
    SubsectionMapping,
  } = await import("../constants/Enum");

  try {
    let finalCat, finalPrefix, finalSuffix, pendingTabs;

    if (activeRole) {
      // Use active role configuration
      console.log("🔹 Using active role configuration:", activeRole);

      // Get category from active role's module
      const moduleConfig = ModuleMapping[activeRole.MODULE];
      if (!moduleConfig) {
        throw new Error(`Unknown module in active role: ${activeRole.MODULE}`);
      }
      finalCat = moduleConfig.cat;
      finalSuffix = moduleConfig.suffix;

      // Get prefix from active role's subsection
      const subsectionConfig = SubsectionMapping[activeRole.SUB_SECTION];
      if (!subsectionConfig) {
        throw new Error(
          `Unknown subsection in active role: ${activeRole.SUB_SECTION}`
        );
      }
      finalPrefix = subsectionConfig.prefix;

      // Generate all role level codes for the active role's subsection and module
      const allRoleCodes = getAllRoleLevelCodes(
        activeRole.SUB_SECTION,
        activeRole.MODULE
      );
      pendingTabs = allRoleCodes
        .filter((item) => item.isValid)
        .map((item) => item.apiCode);

      console.log(`📋 Generated API codes from active role:`, pendingTabs);
    } else {
      // Fallback to legacy configuration
      console.log("🔹 Using legacy configuration (cat, suffix)");
      if (!cat || !suffix) {
        throw new Error("Either activeRole or (cat + suffix) must be provided");
      }

      finalCat = cat;
      finalSuffix = suffix;
      finalPrefix = deptPrefix || "U";

      // Generate pending tabs the old way
      pendingTabs = roleDigits.map(
        (digit) => `${finalPrefix}${digit}${finalSuffix}`
      );
    }

    console.log(
      `🚀 Fetching queries for category: ${finalCat}, API codes: ${pendingTabs.join(
        ", "
      )}`
    );

    if (onProgress) {
      onProgress({
        step: "starting",
        total: pendingTabs.length * 2 + 1,
        activeRole: activeRole?.PORTFOLIO_NAME || "Legacy",
        apiCodes: pendingTabs,
      });
    }

    // Create all fetch tasks
    const tasks = [
      // Fetch replied queries (not role-specific)
      {
        name: "replied",
        task: dispatch(fetchRepliedQueries()),
      },
      // Fetch pending queries for each role
      ...pendingTabs.map((pendingWith) => ({
        name: `pending-${pendingWith}`,
        task: dispatch(fetchPendingQueries({ cat: finalCat, pendingWith })),
      })),
      // Fetch transferred queries for each role
      ...pendingTabs.map((pendingWith) => ({
        name: `transferred-${pendingWith}`,
        task: dispatch(fetchTransferredQueries({ cat: finalCat, pendingWith })),
      })),
    ];

    // Execute all tasks with detailed progress tracking
    const results = await Promise.allSettled(
      tasks.map(async (taskObj, index) => {
        try {
          if (onProgress) {
            onProgress({
              step: "fetching",
              current: index + 1,
              total: tasks.length,
              taskName: taskObj.name,
            });
          }

          const result = await taskObj.task;
          console.log(`✅ Successfully fetched ${taskObj.name}`);

          return {
            name: taskObj.name,
            status: "fulfilled",
            data: result,
          };
        } catch (error) {
          console.error(`❌ Failed to fetch ${taskObj.name}:`, error);

          if (onError) {
            onError({
              taskName: taskObj.name,
              error: error,
              index: index,
            });
          }

          return {
            name: taskObj.name,
            status: "rejected",
            error: error,
          };
        }
      })
    );

    // Process results
    const successful = results.filter((r) => r.value?.status === "fulfilled");
    const failed = results.filter((r) => r.value?.status === "rejected");

    console.log(
      `📊 Query fetch completed: ${successful.length} successful, ${failed.length} failed`
    );

    if (onProgress) {
      onProgress({
        step: "completed",
        successful: successful.length,
        failed: failed.length,
        total: tasks.length,
      });
    }

    // Return detailed results
    return {
      success: true,
      total: tasks.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r) => r.value),
      errors: failed.map((r) => r.value),
      pendingTabs,
      category: finalCat,
      activeRole: activeRole?.PORTFOLIO_NAME || "Legacy",
    };
  } catch (error) {
    console.error("Critical error in fetchAllUserQueries:", error);

    if (onError) {
      onError({
        taskName: "fetchAllUserQueries",
        error: error,
        critical: true,
      });
    }

    return {
      success: false,
      error: error,
      total: 0,
      successful: 0,
      failed: 0,
    };
  }
};

/**
 * Fetch queries specifically for active role change
 * @param {Function} dispatch - Redux dispatch function
 * @param {Object} newActiveRole - New active role object
 * @param {Function} [onProgress] - Progress callback
 * @param {Function} [onError] - Error callback
 * @returns {Promise<Object>} - Fetch results
 */
export const fetchQueriesForRole = async (
  dispatch,
  newActiveRole,
  onProgress,
  onError
) => {
  console.log(
    "🔄 Fetching queries for role change:",
    newActiveRole.PORTFOLIO_NAME
  );

  return fetchAllUserQueries(dispatch, {
    activeRole: newActiveRole,
    onProgress: (progress) => {
      if (onProgress) {
        onProgress({
          ...progress,
          roleChange: true,
          roleName: newActiveRole.PORTFOLIO_NAME,
        });
      }
    },
    onError,
  });
};

/**
 * Get localStorage data with error handling
 * @param {string} key - localStorage key
 * @returns {Object|null} - Parsed data or null
 */
export const getLocalStorageData = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn(`Failed to read from localStorage key: ${key}`, error);
    return null;
  }
};

/**
 * Set localStorage data with error handling
 * @param {string} key - localStorage key
 * @param {any} data - Data to store
 * @returns {boolean} - Success status
 */
export const setLocalStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage key: ${key}`, error);
    return false;
  }
};

/**
 * Format ISO date string to locale string
 * @param {string} iso - ISO date string
 * @returns {string} - Formatted date string
 */
export const formatIso = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
};

/**
 * Generate role tabs for a department
 * @param {string} deptPrefix - Department prefix (e.g., "U")
 * @param {string} suffix - Department suffix (e.g., "A")
 * @param {Object} [roleMapping] - Custom role mapping
 * @returns {Array} - Array of role tab strings
 */
export const generateRoleTabs = (
  deptPrefix = "U",
  suffix = "A",
  roleMapping = { creator: "1", approver: "2", verifier: "3" }
) => {
  return Object.values(roleMapping).map(
    (digit) => `${deptPrefix}${digit}${suffix}`
  );
};

/**
 * Trigger custom localStorage update events
 * @param {string} eventName - Event name
 * @param {any} data - Event data
 */
export const triggerStorageEvent = (eventName, data) => {
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  } catch (error) {
    console.warn(`Failed to trigger event: ${eventName}`, error);
  }
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if user has required permissions
 * @param {Object} userDetails - User details object
 * @param {string} requiredRole - Required role
 * @returns {boolean} - Permission status
 */
export const hasPermission = (userDetails, requiredRole) => {
  if (!userDetails?.LOGIN_PORTFOLIO) return false;
  return userDetails.LOGIN_PORTFOLIO.some(
    (role) => role.ROLE_NAME === requiredRole
  );
};

/**
 * Get current active role from anywhere in the app
 * @returns {Object|null} - Current active role object
 */
export const getCurrentActiveRole = () => {
  try {
    const stored = localStorage.getItem("activeRole_v1");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error getting current active role:", error);
    return null;
  }
};

/**
 * Check if current active role has specific permission
 * @param {string} requiredRole - Required role (CREATOR, APPROVER, VERIFIER)
 * @returns {boolean} - Permission status
 */
export const hasActiveRolePermission = (requiredRole) => {
  const activeRole = getCurrentActiveRole();
  return activeRole?.USER_ROLE === requiredRole;
};

/**
 * Check if current active role has access to specific cell
 * @param {string|number} cellNumber - Cell number to check
 * @returns {boolean} - Access status
 */
export const hasActiveCellAccess = (cellNumber) => {
  const activeRole = getCurrentActiveRole();
  if (!activeRole?.CELL_ALLOTED) return false;

  const allowedCells = activeRole.CELL_ALLOTED.split(",").map((cell) =>
    cell.trim()
  );
  return (
    allowedCells.includes(String(cellNumber)) || allowedCells.includes("AWL")
  );
};

/**
 * Get active role info in a structured format
 * @returns {Object|null} - Structured active role information
 */
export const getActiveRoleInfo = () => {
  const activeRole = getCurrentActiveRole();
  if (!activeRole) return null;

  return {
    roleId: activeRole.ROLE_ID,
    portfolioName: activeRole.PORTFOLIO_NAME,
    userRole: activeRole.USER_ROLE,
    subSection: activeRole.SUB_SECTION,
    module: activeRole.MODULE,
    moduleCategory: activeRole.MODULE_CAT,
    portfolioLevel: activeRole.PORTFOLIO_LEVEL,
    cellsAlloted: activeRole.CELL_ALLOTED
      ? activeRole.CELL_ALLOTED.split(",").map((c) => c.trim())
      : [],
    system: activeRole.SYSTEM,
    createdDate: activeRole.CREATED_DATE,
    createdBy: activeRole.CREATED_BY,
  };
};

/**
 * Fetch first dropdown data (Transfer to Verifier option)
 * @param {string} pendingWith - Current pending with value (e.g., "U1A")
 * @returns {Promise<Object>} First dropdown option data
 */
export const fetchTransferToVerifierOption = async (pendingWith) => {
  try {
    const activeRole = getCurrentActiveRole();
    if (!activeRole) {
      throw new Error("No active role found");
    }

    const requestBody = {
      ROLE_ID: String(activeRole.ROLE_ID),
      loginPortfolioSection: activeRole.SUB_SECTION,
      loginPortfolioLevel: String(activeRole.PORTFOLIO_LEVEL),
      pendingWith: pendingWith,
      api_token: "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS",
    };

    console.log("🔄 Fetching transfer to verifier option:", requestBody);

    const response = await fetch(
      "http://175.25.5.7/API/controller.php?ivrsIqmsDropFirst",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "API returned success: false");
    }

    console.log("✅ Transfer to verifier option fetched:", data.data);
    return data.data;
  } catch (error) {
    console.error("❌ Error fetching transfer to verifier option:", error);
    throw error;
  }
};

/**
 * Fetch second dropdown data (Transfer to Subsection options)
 * @param {string} docId - Document ID from query details
 * @returns {Promise<Array>} Array of subsection transfer options
 */
export const fetchTransferToSubsectionOptions = async (docId) => {
  try {
    const activeRole = getCurrentActiveRole();
    if (!activeRole) {
      throw new Error("No active role found");
    }

    const requestBody = {
      ROLE_ID: String(activeRole.ROLE_ID),
      loginPortfolioSection: activeRole.SUB_SECTION,
      loginPortfolioLevel: String(activeRole.PORTFOLIO_LEVEL),
      docId: String(docId),
      api_token: "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS",
    };

    console.log("🔄 Fetching transfer to subsection options:", requestBody);

    const response = await fetch(
      "http://175.25.5.7/API/controller.php?ivrsIqmsDropSecond",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "API returned success: false");
    }

    console.log(
      "✅ Transfer to subsection options fetched:",
      data.data.length,
      "options"
    );
    return data.data || [];
  } catch (error) {
    console.error("❌ Error fetching transfer to subsection options:", error);
    throw error;
  }
};

/**
 * Get role level mapping for API calls
 * @param {string} userRole - User role (CREATOR, VERIFIER, APPROVER)
 * @returns {string} Portfolio level (1, 2, 3)
 */
export const getRoleLevelForApi = (userRole) => {
  const roleMappings = {
    CREATOR: "1",
    VERIFIER: "2",
    APPROVER: "3",
  };
  return roleMappings[userRole?.toUpperCase()] || "1";
};
