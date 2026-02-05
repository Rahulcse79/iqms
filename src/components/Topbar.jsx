import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Button,
  Typography,
  Popover,
  Divider,
  Avatar,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { RiMenuFill, RiLogoutBoxRLine } from "react-icons/ri";
import { FaUserCircle } from "react-icons/fa";
import { GrRefresh } from "react-icons/gr";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

// Hooks & Utils
import { useThemeContext } from "../theme/ThemeProvider";
import { useActiveRole } from "../hooks/useActiveRole";
import { getUserRoleLabel } from "../constants/Enum";
import { getDesignationFlags, fetchQueriesForRoleNew } from "../utils/helpers";
import { logoutAPI } from "../utils/endpoints";

// Components
import Loader from "./Loader";
import ChangePasswordDialog from "./ChangePasswordDialog";

// Layout constants
const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const TOPBAR_HEIGHT = 94;

// Styled Components
const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => !['isCollapsed', 'isMobile'].includes(prop),
})(({ theme, isCollapsed, isMobile }) => ({
  position: 'fixed',
  top: 0,
  left: isMobile ? 0 : (isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH),
  width: isMobile ? '100%' : `calc(100% - ${isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px)`,
  height: TOPBAR_HEIGHT,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 1px 6px rgba(0, 0, 0, 0.04)',
  transition: `left 0.28s ease, width 0.28s ease, background 0.18s ease`,
  zIndex: 1200,
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  minHeight: `${TOPBAR_HEIGHT}px !important`,
  padding: '12px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  [theme.breakpoints.down('sm')]: {
    padding: '0 12px',
  },
}));

const ControlGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: 1,
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  minWidth: 120,
  '& .MuiSelect-select': {
    padding: '8px 10px',
    fontSize: '0.875rem',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& input': {
      padding: '8px 10px',
      fontSize: '0.875rem',
    },
  },
  minWidth: 180,
  [theme.breakpoints.down('md')]: {
    minWidth: 120,
  },
}));

const RefreshIcon = styled(GrRefresh, {
  shouldForwardProp: (prop) => prop !== 'spinning',
})(({ theme, spinning }) => ({
  fontSize: 22,
  fontWeight: 700,
  cursor: spinning ? 'not-allowed' : 'pointer',
  color: theme.palette.text.primary,
  opacity: spinning ? 0.6 : 1,
  animation: spinning ? 'spin 1s linear infinite' : 'none',
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
}));

const UserCard = styled(Box)(({ theme }) => ({
  padding: 16,
  minWidth: 320,
  maxWidth: 400,
}));

const ProfileRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  fontSize: 13,
  marginBottom: 6,
}));

const ProfileLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 13,
}));

const ProfileValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: 13,
  textAlign: 'right',
}));

const ThemeToggle = styled(Box)(({ theme }) => ({
  cursor: 'pointer',
  userSelect: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  border: `1px solid ${theme.palette.divider}`,
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

/**
 * Topbar with Enhanced Active Role Management
 *
 * - Manages active role switching with automatic query fetching
 * - Fetches queries whenever role changes
 * - Shows loading states during role switches
 */
const Topbar = ({ toggleSidebar, isCollapsed = false, isMobile = false }) => {
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({});
  const [errorPlaceholder, setErrorPlaceholder] = useState("");
  const [isError, setIsError] = useState(false);

  // Role switching states
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchProgress, setSwitchProgress] = useState({});

  // Change password dialog state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    localStorage.removeItem("queryDrafts_v2");
    await logoutAPI();
    navigate("/login");
  };

  // Use the active role hook
  const {
    activeRole,
    userDetails: fullProfile,
    portfolioOptions: portfolios,
    roleInfo,
    loading: roleLoading,
    error: roleError,
    setActiveRole,
  } = useActiveRole();

  const [airForceProfile, setAirForceProfile] = useState(null);

  useEffect(() => {
    try {
      const storedAFUser = localStorage.getItem("airForceUserDetails");
      if (storedAFUser) setAirForceProfile(JSON.parse(storedAFUser));
    } catch (err) {
      console.warn("Failed to load air force user profile:", err);
    }
  }, []);

  const categories = airForceProfile?.categoryQuery || [
    "AIRMEN",
    "OFFICER",
    "CIVILIAN",
  ];
  const [searchCategory, setSearchCategory] = useState(categories[0] || "");

  /** 🔄 Manual Refresh */
  const handleRefreshScreen = async () => {
    if (switchingRole || isManualRefreshing) return; // Prevent multiple refreshes

    console.log("🔄 Manual data refresh initiated...");
    setIsManualRefreshing(true);
    setRefreshProgress({ step: "starting" });
    navigate("/"); // Navigate to home to reset view

    try {
      setRefreshProgress({ step: "fetching", taskName: "designation flags" });
      const flags = await getDesignationFlags(activeRole);

      const fetchResult = await fetchQueriesForRoleNew(
        dispatch,
        activeRole,
        flags,
        (progress) => {
          setRefreshProgress({
            step: "fetching",
            ...progress,
          });
        },
        (error) => {
          console.warn("Non-critical error during manual refresh:", error);
        }
      );

      console.log(`Data Refresh Completed Through Topbar`, fetchResult);

      if (fetchResult.success) {
        setRefreshProgress({
          step: "completed",
          successful: fetchResult.successful,
          total: fetchResult.total,
        });
        console.log(
          `✅ Queries reloaded for ${activeRole.PORTFOLIO_NAME}: ${fetchResult.successful}/${fetchResult.total} successful`
        );
      } else {
        setRefreshProgress({
          step: "completed_with_errors",
          successful: fetchResult.successful,
          total: fetchResult.total,
        });
        console.warn(
          `⚠️ Some queries failed during refresh for ${activeRole.PORTFOLIO_NAME}`
        );
      }
    } catch (error) {
      console.error("❌ Critical error during data refresh:", error);
      setRefreshProgress({ step: "error", error: error.message });
    } finally {
      // Hide the indicator after a delay
      setTimeout(() => {
        setIsManualRefreshing(false);
        setRefreshProgress({});
      }, 2000);
    }
  };

  /** 🔄 Enhanced Portfolio Change - Now fetches queries for new role */
  const handlePortfolioChange = async (e) => {
    const portfolioName = e.target.value;
    const selected = portfolios.find((p) => p.PORTFOLIO_NAME === portfolioName);

    if (!selected || selected.PORTFOLIO_NAME === activeRole?.PORTFOLIO_NAME) {
      return; // No change needed
    }

    console.log("🔄 Switching role to:", selected.PORTFOLIO_NAME);
    setSwitchingRole(true);
    setSwitchProgress({ step: "switching", roleName: selected.PORTFOLIO_NAME });
    localStorage.removeItem("pendingQueries_v1");
    localStorage.removeItem("transferredQueries_v1");
    navigate("/");

    try {
      // Set the new active role
      const success = setActiveRole(selected);
      if (!success) {
        throw new Error("Failed to set active role");
      }

      console.log("✅ Active role updated successfully");
      setSwitchProgress({
        step: "fetching",
        roleName: selected.PORTFOLIO_NAME,
      });

      console.log("Fetching designation flags for new role...");
      const flags = await getDesignationFlags(selected);

      // Fetch queries for the new role
      const fetchResult = await fetchQueriesForRoleNew(
        dispatch,
        selected,
        flags,
        (progress) => {
          setSwitchProgress({
            step: "fetching",
            roleName: selected.PORTFOLIO_NAME,
            current: progress.current || 0,
            total: progress.total || 0,
            taskName: progress.taskName || "",
            ...progress,
          });
        },
        (error) => {
          console.warn("Non-critical error during role switch:", error);
        }
      );

      console.log(`🎯 Role switch completed:`, fetchResult);

      if (fetchResult.success) {
        console.log(
          `✅ Queries loaded for ${selected.PORTFOLIO_NAME}: ${fetchResult.successful}/${fetchResult.total} successful`
        );

        // Optional: Show success notification
        setSwitchProgress({
          step: "completed",
          roleName: selected.PORTFOLIO_NAME,
          successful: fetchResult.successful,
          total: fetchResult.total,
        });

        window.dispatchEvent(
          new CustomEvent("activeRoleChanged", {
            detail: { newRole: selected },
          })
        );
      } else {
        console.warn(
          `⚠️ Some queries failed for ${selected.PORTFOLIO_NAME}, but role switched successfully`
        );
      }

      // Small delay to show completion
      setTimeout(() => {
        setSwitchingRole(false);
        setSwitchProgress({});
      }, 1000);

      window.dispatchEvent(
        new CustomEvent("activeRoleChanged", {
          detail: { newRole: selected },
        })
      );
    } catch (error) {
      console.error("❌ Error during role switch:", error);
      setSwitchProgress({ step: "error", error: error.message });

      // Reset after showing error
      setTimeout(() => {
        setSwitchingRole(false);
        setSwitchProgress({});
      }, 3000);

      window.dispatchEvent(
        new CustomEvent("activeRoleChanged", {
          detail: { newRole: selected },
        })
      );
    }
  };

  /** 🔍 Search Logic */
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("Service");

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (/^\d{6}$/.test(value)) {
      setSearchType("Service");
    } else if (/^\d{8}$/.test(value)) {
      setSearchType("Query");
    }
  };

  const handleSearch = () => {
    if (!searchValue.trim()) {
      setIsError(true);
      setErrorPlaceholder("No input value");
      setSearchValue("");

      setTimeout(() => {
        setIsError(false);
        setErrorPlaceholder("");
      }, 2000);

      return;
    }

    const targetPath = `/search-results?category=${encodeURIComponent(
      searchCategory
    )}&type=${encodeURIComponent(searchType)}&q=${encodeURIComponent(
      searchValue.trim()
    )}`;

    if (
      location.pathname + location.search ===
      "/search-results" + targetPath.slice("/search-results".length)
    ) {
      return;
    }

    const state = {};
    if (!location.pathname.startsWith("/search-results")) {
      state.from = location.pathname + location.search;
    }

    navigate(targetPath, { state });
  };

  // Get manual refresh indicator text
  const getRefreshIndicatorText = () => {
    switch (refreshProgress.step) {
      case "starting":
        return "Refreshing...";
      case "fetching":
        return refreshProgress.taskName
          ? `Loading ${refreshProgress.taskName} (${refreshProgress.current}/${refreshProgress.total})`
          : "Fetching data...";
      case "completed":
        return `✅ Refresh complete (${refreshProgress.successful}/${refreshProgress.total})`;
      case "completed_with_errors":
        return `⚠️ Refresh complete with errors`;
      case "error":
        return `❌ Error: ${refreshProgress.error}`;
      default:
        return "";
    }
  };

  // Profile popup state
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const isProfileOpen = Boolean(profileAnchorEl);

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  // Close profile popup when route changes
  useEffect(() => {
    handleProfileClose();
  }, [location.pathname, location.search]);

  // Get role switching status text
  const getRoleSwitchingText = () => {
    switch (switchProgress.step) {
      case "switching":
        return `Switching to ${switchProgress.roleName}...`;
      case "fetching":
        return switchProgress.taskName
          ? `Loading ${switchProgress.taskName} (${switchProgress.current}/${switchProgress.total})`
          : `Loading data for ${switchProgress.roleName}...`;
      case "completed":
        return `✅ ${switchProgress.roleName} loaded (${switchProgress.successful}/${switchProgress.total})`;
      case "error":
        return `❌ Error: ${switchProgress.error}`;
      default:
        return "";
    }
  };

  const handleChangePassword = () => {
    handleProfileClose();
    setIsChangePasswordOpen(true);
  };

  const handlePasswordChanged = () => {
    setIsChangePasswordOpen(false);
    handleLogout();
  };

  // Render profile row helper
  const renderProfileRow = (label, value) => {
    if (!value) return null;
    return (
      <ProfileRow key={label}>
        <ProfileLabel>{label}</ProfileLabel>
        <ProfileValue>{value}</ProfileValue>
      </ProfileRow>
    );
  };

  // Show loading state if role is loading
  if (roleLoading) {
    return (
      <StyledAppBar isCollapsed={isCollapsed} isMobile={isMobile}>
        <StyledToolbar>
          <Box sx={{ p: 2, textAlign: 'center', width: '100%' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography component="span" variant="body2">
              Loading user roles...
            </Typography>
          </Box>
        </StyledToolbar>
      </StyledAppBar>
    );
  }

  if (isManualRefreshing) {
    return <Loader text={getRefreshIndicatorText()} />;
  }

  return (
    <>
      <StyledAppBar isCollapsed={isCollapsed} isMobile={isMobile}>
        <StyledToolbar>
          {/* Left: Sidebar Toggle + Portfolio */}
          <ControlGroup sx={{ justifyContent: 'flex-start' }}>
            <IconButton
              onClick={toggleSidebar}
              title="Toggle sidebar"
              size="small"
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <RiMenuFill />
            </IconButton>

            <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
              Portfolio:
            </Typography>

            <FormControl size="small">
              <StyledSelect
                value={activeRole?.PORTFOLIO_NAME || ""}
                onChange={handlePortfolioChange}
                disabled={portfolios.length === 0 || switchingRole}
                title={switchingRole ? getRoleSwitchingText() : "Select portfolio"}
                sx={{ 
                  opacity: switchingRole ? 0.7 : 1,
                  minWidth: 140,
                }}
              >
                {portfolios.length > 0 ? (
                  portfolios.map((p, idx) => (
                    <MenuItem key={idx} value={p.PORTFOLIO_NAME}>
                      {p.PORTFOLIO_NAME} ({p.USER_ROLE})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No portfolios available</MenuItem>
                )}
              </StyledSelect>
            </FormControl>

            {switchingRole && (
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  maxWidth: 200,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
                title={getRoleSwitchingText()}
              >
                {switchProgress.step === "fetching" && "🔄 "}
                {getRoleSwitchingText()}
              </Typography>
            )}

            {roleError && (
              <Tooltip title={roleError}>
                <Typography sx={{ color: 'error.main', fontSize: 12 }}>⚠️</Typography>
              </Tooltip>
            )}
          </ControlGroup>

          {/* Refresh Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={
              switchingRole 
                ? "Role switching in progress..." 
                : isManualRefreshing 
                  ? getRefreshIndicatorText() 
                  : "Refresh data"
            }>
              <IconButton
                onClick={handleRefreshScreen}
                disabled={switchingRole || isManualRefreshing}
                size="small"
              >
                <RefreshIcon spinning={isManualRefreshing || switchingRole} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Center: Category + Search */}
          <ControlGroup sx={{ justifyContent: 'center', flexGrow: 1 }}>
            <FormControl size="small">
              <StyledSelect
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                disabled={categories.length === 0}
                sx={{ minWidth: 100 }}
              >
                {categories.length > 0 ? (
                  categories.map((cat, idx) => (
                    <MenuItem key={idx} value={cat}>{cat}</MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No categories</MenuItem>
                )}
              </StyledSelect>
            </FormControl>

            <FormControl size="small">
              <StyledSelect
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                sx={{ minWidth: 100 }}
              >
                <MenuItem value="Service">Service No.</MenuItem>
                <MenuItem value="Query">Query</MenuItem>
              </StyledSelect>
            </FormControl>

            <StyledTextField
              size="small"
              placeholder={
                errorPlaceholder ||
                (searchType === "Query" ? "Enter Query ID" : "Enter Service No.")
              }
              value={searchValue}
              onChange={handleSearchInputChange}
              error={isError}
              sx={{ flex: 1, maxWidth: 220 }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              size="small"
              sx={{ minWidth: 80 }}
            >
              Search
            </Button>
          </ControlGroup>

          {/* Right: Theme + Profile */}
          <ControlGroup sx={{ justifyContent: 'flex-end' }}>
            <ThemeToggle onClick={toggleTheme} title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}>
              {mode === 'dark' ? '🌙 Dark' : '🌤 Light'}
            </ThemeToggle>

            <IconButton
              onClick={handleProfileClick}
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
              title="Open profile"
              sx={{
                p: 0.75,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <FaUserCircle style={{ fontSize: 28 }} />
            </IconButton>

            {/* Profile Popover */}
            <Popover
              open={isProfileOpen}
              anchorEl={profileAnchorEl}
              onClose={handleProfileClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2.5,
                  boxShadow: (theme) => theme.shadows[8],
                  border: 1,
                  borderColor: 'divider',
                }
              }}
            >
              <UserCard>
                {/* Profile Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        fontWeight: 700,
                      }}
                    >
                      {(fullProfile?.LOGIN_NAME && fullProfile.LOGIN_NAME[0]) || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {fullProfile?.LOGIN_NAME || "No Name"}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={handleProfileClose} title="Close">
                    <Typography>✕</Typography>
                  </IconButton>
                </Box>

                {/* User Details */}
                <Box sx={{ mb: 2 }}>
                  {renderProfileRow("Service No.", fullProfile?.LOGIN_SNO)}
                  {renderProfileRow("Rank", fullProfile?.RANK || fullProfile?.RANK_NAME || fullProfile?.RANK_AND_NAME)}
                  {renderProfileRow("Dept.", fullProfile?.MODULE)}
                  {renderProfileRow("Category", getUserRoleLabel(fullProfile?.LOGIN_CAT))}
                </Box>

                {/* Active Role Details */}
                {activeRole && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box>
                      <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                        Active Role {switchingRole && <span>🔄</span>}
                      </Typography>
                      {renderProfileRow("Portfolio", activeRole.PORTFOLIO_NAME)}
                      {renderProfileRow("Role", activeRole.USER_ROLE)}
                      {renderProfileRow("Sub Section", activeRole.SUB_SECTION)}
                      {renderProfileRow("Module", activeRole.MODULE)}
                      {renderProfileRow("Level", activeRole.PORTFOLIO_LEVEL)}
                      {roleInfo?.cellsAlloted?.length > 0 && 
                        renderProfileRow("Cells", `${roleInfo.cellsAlloted.length} assigned`)
                      }
                    </Box>
                  </>
                )}

                {/* Action Buttons */}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleChangePassword}
                  sx={{ mt: 2, bgcolor: '#292fe4', '&:hover': { bgcolor: '#1e22b8' } }}
                >
                  Change password
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleLogout}
                  startIcon={<RiLogoutBoxRLine />}
                  sx={{ mt: 1.5, bgcolor: '#ff4d4f', '&:hover': { bgcolor: '#d9363e' } }}
                >
                  Logout
                </Button>
              </UserCard>
            </Popover>
          </ControlGroup>
        </StyledToolbar>
      </StyledAppBar>

      {isChangePasswordOpen && (
        <ChangePasswordDialog
          onClose={() => setIsChangePasswordOpen(false)}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </>
  );
};

export default Topbar;
