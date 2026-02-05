import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { IconContext } from "react-icons";

// Components
import SidebarDataPage from "./SidebarDataPage";
import SubMenu from "./SubMenu";

// Assets
import SidebarLogo from '../assets/Images/sidebar-logo.png';

// Layout constants
const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 80;
const TOPBAR_HEIGHT = 90;

// Styled Components
const SidebarRoot = styled(Box, {
  shouldForwardProp: (prop) => !['isCollapsed', 'isMobile', 'isOpen'].includes(prop),
})(({ theme, isCollapsed, isMobile, isOpen }) => ({
  width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1100,
  overflowX: 'hidden',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  transition: `width 0.28s ease, transform 0.28s ease`,
  // Mobile styles
  ...(isMobile && {
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    width: SIDEBAR_WIDTH,
    boxShadow: isOpen ? '0 12px 30px rgba(0,0,0,0.4)' : 'none',
  }),
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 16px',
  height: TOPBAR_HEIGHT,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  whiteSpace: 'nowrap',
  flexShrink: 0,
}));

const LogoImg = styled('img')({
  height: 42,
  width: 32,
  padding: 4,
  backgroundColor: '#fff',
  borderRadius: 4,
});

const HeaderTitle = styled(Typography)(({ theme }) => ({
  marginLeft: 12,
  fontWeight: 'bold',
  fontSize: 22,
  color: theme.palette.text.primary,
}));

const SidebarContent = styled(Box)({
  width: '100%',
  flex: 1,
  overflowY: 'auto',
  paddingTop: 10,
});

/**
 * Sidebar Component
 * Navigation sidebar with collapsible menu items
 * 
 * @param {boolean} isCollapsed - Whether sidebar is collapsed (desktop)
 * @param {boolean} isOpen - Whether sidebar is open (mobile)
 * @param {boolean} isMobile - Whether in mobile view
 * @param {function} onClose - Callback to close sidebar (mobile)
 */
const Sidebar = ({ isCollapsed = false, isOpen = false, isMobile = false, onClose }) => {
  const theme = useTheme();
  const SidebarData = SidebarDataPage();
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  const handleItemClick = () => {
    // Close sidebar on mobile when an item is clicked
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <IconContext.Provider value={{ color: theme.palette.text.secondary }}>
      <SidebarRoot 
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        isOpen={isOpen}
        component="nav"
        aria-label="Main navigation"
      >
        <SidebarHeader>
          <LogoImg src={SidebarLogo} alt="IQMS Logo" />
          {!isCollapsed && <HeaderTitle variant="h6">IVRS</HeaderTitle>}
        </SidebarHeader>
        
        <SidebarContent>
          {SidebarData.map((item, index) => (
            <SubMenu
              item={item}
              key={index}
              isOpen={openMenu === index}
              onToggle={() => toggleMenu(index)}
              isCollapsed={isCollapsed}
              onItemClick={handleItemClick}
            />
          ))}
        </SidebarContent>
      </SidebarRoot>
    </IconContext.Provider>
  );
};

export default Sidebar;
