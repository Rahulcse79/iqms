// hooks/useActiveRole.js
import { useState, useEffect, useCallback, useMemo } from 'react';

const ACTIVE_ROLE_KEY = 'activeRole_v1';
const USER_DETAILS_KEY = 'userDetails';

/**
 * Custom hook to manage active role throughout the application
 * Provides methods to get, set, and listen to active role changes
 */
export const useActiveRole = () => {
  const [activeRole, setActiveRoleState] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data from localStorage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user details
        const storedUserDetails = localStorage.getItem(USER_DETAILS_KEY);
        if (storedUserDetails) {
          const userData = JSON.parse(storedUserDetails);
          setUserDetails(userData);

          // Load active role
          const storedActiveRole = localStorage.getItem(ACTIVE_ROLE_KEY);
          if (storedActiveRole) {
            const activeRoleData = JSON.parse(storedActiveRole);
            
            // Verify the active role still exists in user's portfolio
            const portfolioExists = userData.LOGIN_PORTFOLIO?.some(
              portfolio => portfolio.PORTFOLIO_NAME === activeRoleData.PORTFOLIO_NAME &&
                          portfolio.ROLE_ID === activeRoleData.ROLE_ID
            );

            if (portfolioExists) {
              setActiveRoleState(activeRoleData);
            } else {
              console.warn('Stored active role no longer exists in user portfolio, setting first available');
              // Set first portfolio as default if stored role doesn't exist
              if (userData.LOGIN_PORTFOLIO?.length > 0) {
                const defaultRole = userData.LOGIN_PORTFOLIO[0];
                setActiveRoleState(defaultRole);
                localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(defaultRole));
              }
            }
          } else {
            // No stored active role, set first portfolio as default
            if (userData.LOGIN_PORTFOLIO?.length > 0) {
              const defaultRole = userData.LOGIN_PORTFOLIO[0];
              setActiveRoleState(defaultRole);
              localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(defaultRole));
            }
          }
        } else {
          console.warn('No user details found in localStorage');
        }
      } catch (err) {
        console.error('Error loading active role data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Listen for localStorage changes (when user details or active role changes)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === ACTIVE_ROLE_KEY) {
        try {
          const newActiveRole = e.newValue ? JSON.parse(e.newValue) : null;
          setActiveRoleState(newActiveRole);
          
          // Dispatch custom event for components that need to react to role changes
          window.dispatchEvent(new CustomEvent('activeRoleChanged', {
            detail: { newRole: newActiveRole }
          }));
        } catch (err) {
          console.error('Error parsing active role from storage:', err);
        }
      } else if (e.key === USER_DETAILS_KEY) {
        try {
          const newUserDetails = e.newValue ? JSON.parse(e.newValue) : null;
          setUserDetails(newUserDetails);
        } catch (err) {
          console.error('Error parsing user details from storage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Function to set active role
  const setActiveRole = useCallback((role) => {
    if (!role) {
      console.warn('Attempting to set null/undefined active role');
      return false;
    }

    try {
      // Validate that the role exists in user's portfolio
      if (userDetails?.LOGIN_PORTFOLIO) {
        const roleExists = userDetails.LOGIN_PORTFOLIO.some(
          portfolio => portfolio.PORTFOLIO_NAME === role.PORTFOLIO_NAME &&
                      portfolio.ROLE_ID === role.ROLE_ID
        );

        if (!roleExists) {
          console.error('Role does not exist in user portfolio:', role);
          setError('Invalid role selection');
          return false;
        }
      }

      // Update state and localStorage
      setActiveRoleState(role);
      localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(role));
      
      // Dispatch custom event for immediate notification in same tab
      window.dispatchEvent(new CustomEvent('activeRoleChanged', {
        detail: { newRole: role }
      }));

      console.log('Active role updated:', role);
      return true;
    } catch (err) {
      console.error('Error setting active role:', err);
      setError(err.message);
      return false;
    }
  }, [userDetails]);

  // Function to get role by portfolio name
  const getRoleByPortfolioName = useCallback((portfolioName) => {
    if (!userDetails?.LOGIN_PORTFOLIO) return null;
    
    return userDetails.LOGIN_PORTFOLIO.find(
      portfolio => portfolio.PORTFOLIO_NAME === portfolioName
    ) || null;
  }, [userDetails]);

  // Function to check if user has specific permission
  const hasPermission = useCallback((requiredRole) => {
    if (!activeRole) return false;
    return activeRole.USER_ROLE === requiredRole;
  }, [activeRole]);

  // Function to check if user has access to specific cells
  const hasAccessToCell = useCallback((cellNumber) => {
    if (!activeRole?.CELL_ALLOTED) return false;
    
    const allowedCells = activeRole.CELL_ALLOTED.split(',').map(cell => cell.trim());
    return allowedCells.includes(String(cellNumber)) || allowedCells.includes('AWL');
  }, [activeRole]);

  // Computed values
  const portfolioOptions = useMemo(() => {
    return userDetails?.LOGIN_PORTFOLIO || [];
  }, [userDetails]);

  const roleInfo = useMemo(() => {
    if (!activeRole) return null;
    
    return {
      roleId: activeRole.ROLE_ID,
      portfolioName: activeRole.PORTFOLIO_NAME,
      userRole: activeRole.USER_ROLE,
      subSection: activeRole.SUB_SECTION,
      module: activeRole.MODULE,
      moduleCategory: activeRole.MODULE_CAT,
      portfolioLevel: activeRole.PORTFOLIO_LEVEL,
      cellsAlloted: activeRole.CELL_ALLOTED ? activeRole.CELL_ALLOTED.split(',').map(c => c.trim()) : [],
      system: activeRole.SYSTEM,
      createdDate: activeRole.CREATED_DATE,
      createdBy: activeRole.CREATED_BY
    };
  }, [activeRole]);

  return {
    // Current active role data
    activeRole,
    userDetails,
    roleInfo,
    
    // Available portfolios
    portfolioOptions,
    
    // State management
    loading,
    error,
    
    // Actions
    setActiveRole,
    getRoleByPortfolioName,
    
    // Permission checks
    hasPermission,
    hasAccessToCell,
    
    // Helper functions
    refreshUserData: () => {
      const storedUserDetails = localStorage.getItem(USER_DETAILS_KEY);
      if (storedUserDetails) {
        setUserDetails(JSON.parse(storedUserDetails));
      }
    },
    
    clearActiveRole: () => {
      setActiveRoleState(null);
      localStorage.removeItem(ACTIVE_ROLE_KEY);
    }
  };
};

// Export utility functions for use outside of React components
export const getStoredActiveRole = () => {
  try {
    const stored = localStorage.getItem(ACTIVE_ROLE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting stored active role:', error);
    return null;
  }
};

export const setStoredActiveRole = (role) => {
  try {
    if (role) {
      localStorage.setItem(ACTIVE_ROLE_KEY, JSON.stringify(role));
      // Dispatch event for components that might be listening
      window.dispatchEvent(new CustomEvent('activeRoleChanged', {
        detail: { newRole: role }
      }));
    } else {
      localStorage.removeItem(ACTIVE_ROLE_KEY);
    }
    return true;
  } catch (error) {
    console.error('Error setting stored active role:', error);
    return false;
  }
};

export default useActiveRole;
