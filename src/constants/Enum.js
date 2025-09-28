// src/constants/Enum.js

// User Role Mappings
export const UserRole = Object.freeze({
  OFFICER: 0,
  AIRMEN: 1,
  CIVILIAN: 2,
});

// Map numeric code -> display label
export const UserRoleLabel = Object.freeze({
  [UserRole.OFFICER]: "OFFICER",
  [UserRole.AIRMEN]: "AIRMEN",
  [UserRole.CIVILIAN]: "CIVILIAN",
});

// Helper: get label from code
export function getUserRoleLabel(code) {
  return UserRoleLabel[code] ?? "Unknown";
}

// Helper: create options for selects (value = number)
export const userRoleOptions = Object.keys(UserRoleLabel).map((k) => ({
  value: Number(k),
  label: UserRoleLabel[k],
}));

// Module Mappings (APW, OPW, CPW)
export const ModuleMapping = Object.freeze({
  APW: { cat: 1, suffix: "A", label: "Airmen Personnel Wing" },
  OPW: { cat: 0, suffix: "O", label: "Officer Personnel Wing" },
  CPW: { cat: 2, suffix: "C", label: "Civilian Personnel Wing" },
});

// Legacy Department Mapping (kept for backward compatibility)
export const DepartmentMapping = ModuleMapping;

// Subsection Mappings
export const SubsectionMapping = Object.freeze({
  CQC: { prefix: "U", label: "Customer Query Cell" },
  IT: { prefix: "I", label: "Income Tax" },
  // Add more subsections here as needed
  // Example: HR: { prefix: "H", label: "Human Resources" },
  // Example: FIN: { prefix: "F", label: "Finance" },
});

// Role Level Mappings for API codes
export const RoleLevelMapping = Object.freeze({
  CREATOR: "1",
  VERIFIER: "2", 
  APPROVER: "3",
});

// Reverse mapping for role levels
export const RoleLevelReverseMapping = Object.freeze({
  "1": "CREATOR",
  "2": "VERIFIER",
  "3": "APPROVER",
});

/**
 * Generate API code based on subsection, role level, and module
 * Format: {SubsectionPrefix}{RoleLevel}{ModuleSuffix}
 * Examples: U1A, I2O, U3C
 * 
 * @param {string} subsection - Subsection name (CQC, IT, etc.)
 * @param {string} roleLevel - Role level (CREATOR, VERIFIER, APPROVER) or (1, 2, 3)
 * @param {string} module - Module name (APW, OPW, CPW)
 * @returns {string} Generated API code
 */
export function generateApiCode(subsection, roleLevel, module) {
  try {
    // Validate inputs
    if (!subsection || !roleLevel || !module) {
      throw new Error('Missing required parameters: subsection, roleLevel, and module are required');
    }

    // Get subsection prefix
    const subsectionConfig = SubsectionMapping[subsection.toUpperCase()];
    if (!subsectionConfig) {
      throw new Error(`Unknown subsection: ${subsection}. Available: ${Object.keys(SubsectionMapping).join(', ')}`);
    }

    // Get role level digit (handle both string names and numeric strings)
    let roleLevelDigit;
    if (RoleLevelMapping[roleLevel.toUpperCase()]) {
      roleLevelDigit = RoleLevelMapping[roleLevel.toUpperCase()];
    } else if (['1', '2', '3'].includes(roleLevel)) {
      roleLevelDigit = roleLevel;
    } else {
      throw new Error(`Unknown role level: ${roleLevel}. Available: ${Object.keys(RoleLevelMapping).join(', ')} or 1, 2, 3`);
    }

    // Get module suffix
    const moduleConfig = ModuleMapping[module.toUpperCase()];
    if (!moduleConfig) {
      throw new Error(`Unknown module: ${module}. Available: ${Object.keys(ModuleMapping).join(', ')}`);
    }

    // Generate the code
    const apiCode = `${subsectionConfig.prefix}${roleLevelDigit}${moduleConfig.suffix}`;
    
    console.log(`Generated API code: ${apiCode} (${subsection} + ${roleLevel} + ${module})`);
    return apiCode;

  } catch (error) {
    console.error('Error generating API code:', error.message);
    throw error;
  }
}

/**
 * Parse API code back to its components
 * @param {string} apiCode - API code to parse (e.g., "U1A")
 * @returns {Object} Parsed components
 */
export function parseApiCode(apiCode) {
  try {
    if (!apiCode || apiCode.length !== 3) {
      throw new Error('Invalid API code format. Expected 3 characters (e.g., U1A)');
    }

    const prefix = apiCode[0];
    const roleDigit = apiCode[1];
    const suffix = apiCode[2];

    // Find subsection by prefix
    const subsectionEntry = Object.entries(SubsectionMapping).find(
      ([, config]) => config.prefix === prefix
    );
    const subsection = subsectionEntry ? subsectionEntry[0] : null;

    // Find role level by digit
    const roleLevel = RoleLevelReverseMapping[roleDigit] || null;

    // Find module by suffix
    const moduleEntry = Object.entries(ModuleMapping).find(
      ([, config]) => config.suffix === suffix
    );
    const module = moduleEntry ? moduleEntry[0] : null;

    const result = {
      apiCode,
      subsection,
      roleLevel,
      roleLevelDigit: roleDigit,
      module,
      prefix,
      suffix,
      isValid: !!(subsection && roleLevel && module),
    };

    if (!result.isValid) {
      console.warn(`Invalid or unknown components in API code: ${apiCode}`, result);
    }

    return result;
  } catch (error) {
    console.error('Error parsing API code:', error.message);
    return {
      apiCode,
      subsection: null,
      roleLevel: null,
      roleLevelDigit: null,
      module: null,
      prefix: null,
      suffix: null,
      isValid: false,
      error: error.message,
    };
  }
}

/**
 * Generate API code from active role object
 * @param {Object} activeRole - Active role object from useActiveRole hook
 * @returns {string} Generated API code
 */
export function generateApiCodeFromRole(activeRole) {
  if (!activeRole) {
    throw new Error('Active role object is required');
  }

  const subsection = activeRole.SUB_SECTION;
  const roleLevel = activeRole.USER_ROLE;
  const module = activeRole.MODULE;

  return generateApiCode(subsection, roleLevel, module);
}

/**
 * Generate all possible API codes for a user's portfolios
 * @param {Array} portfolios - Array of portfolio objects
 * @returns {Array} Array of API code objects
 */
export function generateAllApiCodes(portfolios) {
  if (!Array.isArray(portfolios)) {
    return [];
  }

  return portfolios.map((portfolio, index) => {
    try {
      const apiCode = generateApiCodeFromRole(portfolio);
      return {
        index,
        portfolio,
        apiCode,
        isValid: true,
        error: null,
      };
    } catch (error) {
      return {
        index,
        portfolio,
        apiCode: null,
        isValid: false,
        error: error.message,
      };
    }
  });
}

/**
 * Get all API codes for different role levels within same subsection and module
 * @param {string} subsection - Subsection name
 * @param {string} module - Module name
 * @returns {Array} Array of API codes for all role levels
 */
export function getAllRoleLevelCodes(subsection, module) {
  const roleLevels = Object.keys(RoleLevelMapping);
  return roleLevels.map(roleLevel => {
    try {
      return {
        roleLevel,
        apiCode: generateApiCode(subsection, roleLevel, module),
        isValid: true,
      };
    } catch (error) {
      return {
        roleLevel,
        apiCode: null,
        isValid: false,
        error: error.message,
      };
    }
  });
}

/**
 * Validate if an API code is properly formatted and exists in our mappings
 * @param {string} apiCode - API code to validate
 * @returns {boolean} Validation result
 */
export function isValidApiCode(apiCode) {
  try {
    const parsed = parseApiCode(apiCode);
    return parsed.isValid;
  } catch {
    return false;
  }
}

/**
 * Get all available subsections
 * @returns {Array} Array of subsection options
 */
export function getSubsectionOptions() {
  return Object.entries(SubsectionMapping).map(([key, value]) => ({
    value: key,
    label: value.label,
    prefix: value.prefix,
  }));
}

/**
 * Get all available modules
 * @returns {Array} Array of module options
 */
export function getModuleOptions() {
  return Object.entries(ModuleMapping).map(([key, value]) => ({
    value: key,
    label: value.label,
    suffix: value.suffix,
    category: value.cat,
  }));
}

/**
 * Get all available role levels
 * @returns {Array} Array of role level options
 */
export function getRoleLevelOptions() {
  return Object.entries(RoleLevelMapping).map(([key, value]) => ({
    value: key,
    label: key,
    digit: value,
  }));
}

// Export helper constants for easy access
export const SUBSECTION_CODES = Object.freeze(
  Object.fromEntries(
    Object.entries(SubsectionMapping).map(([key, value]) => [key, value.prefix])
  )
);

export const MODULE_CODES = Object.freeze(
  Object.fromEntries(
    Object.entries(ModuleMapping).map(([key, value]) => [key, value.suffix])
  )
);

export const ROLE_LEVEL_CODES = Object.freeze(RoleLevelMapping);

// Example usage and testing (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('=== API Code Generation Examples ===');
  
  try {
    // Test code generation
    console.log('U1A =', generateApiCode('CQC', 'CREATOR', 'APW'));
    console.log('I2O =', generateApiCode('IT', 'VERIFIER', 'OPW'));
    console.log('U3C =', generateApiCode('CQC', 'APPROVER', 'CPW'));
    
    // Test code parsing
    console.log('Parse U1A:', parseApiCode('U1A'));
    console.log('Parse I2O:', parseApiCode('I2O'));
    
    // Test validation
    console.log('Is U1A valid?', isValidApiCode('U1A'));
    console.log('Is XYZ valid?', isValidApiCode('XYZ'));
    
  } catch (error) {
    console.log('Test error:', error.message);
  }
}
