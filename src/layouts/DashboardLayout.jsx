import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, useMediaQuery } from "@mui/material";
import { styled, useTheme as useMuiTheme } from "@mui/material/styles";

// Components
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

// Hooks
import { useThemeContext } from "../theme/ThemeProvider";
import useIdleLogout from "../hooks/useIdleLogout";

// Layout constants (matching original CSS)
const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const TOPBAR_HEIGHT = 94;
const FOOTER_HEIGHT = 60;
const TRANSITION_DURATION = '0.28s';

// Styled Components
const LayoutRoot = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
  position: 'relative',
}));

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => !['isCollapsed', 'isMobile'].includes(prop),
})(({ theme, isCollapsed, isMobile }) => ({
  marginLeft: isMobile ? 0 : (isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH),
  width: isMobile ? '100%' : `calc(100% - ${isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px)`,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  transition: `margin-left ${TRANSITION_DURATION} ease, width ${TRANSITION_DURATION} ease`,
  paddingTop: `calc(${TOPBAR_HEIGHT}px + 16px)`,
  paddingBottom: FOOTER_HEIGHT,
  boxSizing: 'border-box',
  overflowX: 'hidden',
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: '24px 20px',
  overflow: 'auto',
  boxSizing: 'border-box',
  WebkitOverflowScrolling: 'touch',
  [theme.breakpoints.down('sm')]: {
    padding: '12px',
  },
}));

/**
 * DashboardLayout Component
 * Main layout wrapper for authenticated pages
 * Provides sidebar, topbar, and content area
 */
const DashboardLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useThemeContext();
  const location = useLocation();
  
  // Responsive: check if mobile view
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('lg'));
  
  // Install the idle-logout hook (default 5 minutes)
  useIdleLogout();
  
  // Toggle sidebar collapse (desktop)
  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setSidebarCollapsed(!isSidebarCollapsed);
    }
  };
  
  // Close mobile sidebar
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <LayoutRoot>
      {/* Mobile backdrop */}
      {isMobile && isSidebarOpen && (
        <Box
          onClick={handleCloseSidebar}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1090,
          }}
        />
      )}
      
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={handleCloseSidebar}
      />

      <MainContent isCollapsed={isSidebarCollapsed} isMobile={isMobile}>
        <Topbar
          toggleSidebar={toggleSidebar}
          theme={mode}
          toggleTheme={toggleTheme}
          isCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
        />

        <ContentArea component="main">
          <Outlet key={location.pathname + location.search} />
        </ContentArea>
      </MainContent>
    </LayoutRoot>
  );
};

export default DashboardLayout;
