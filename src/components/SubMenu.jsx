import React from "react";
import { NavLink } from "react-router-dom";
import { Box, Typography, Collapse, ButtonBase } from "@mui/material";
import { styled, alpha } from "@mui/material/styles";

// Base styles for all menu items
const menuItemStyles = (theme) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 10px',
  fontSize: '14px',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
  borderLeft: '4px solid transparent',
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  textDecoration: 'none',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderLeftColor: theme.palette.primary.main,
  },
});

// Styled NavLink for navigation items
const SidebarNavLink = styled(NavLink)(({ theme }) => ({
  ...menuItemStyles(theme),
  '&.active': {
    backgroundColor: theme.palette.background.default,
    borderLeftColor: theme.palette.primary.main,
    fontWeight: 500,
  },
}));

// Styled div for toggleable menus (with subNav)
const SidebarToggle = styled(ButtonBase)(({ theme }) => ({
  ...menuItemStyles(theme),
  justifyContent: 'flex-start',
}));

// Styled button for actions like Logout
const SidebarButton = styled(ButtonBase)(({ theme }) => ({
  ...menuItemStyles(theme),
  border: 'none',
  background: 'none',
  justifyContent: 'flex-start',
}));

// Label component
const SidebarLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isCollapsed',
})(({ isCollapsed }) => ({
  marginLeft: 16,
  display: isCollapsed ? 'none' : 'inline-block',
  fontSize: 'inherit',
}));

// Dropdown link for submenu items
const DropdownLink = styled(NavLink)(({ theme }) => ({
  height: 40,
  paddingLeft: '3rem',
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  fontSize: '12px',
  transition: 'all 0.3s ease',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
  },
  '&.active': {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
}));

// Arrow icon container
const ArrowContainer = styled(Box)({
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
});

/**
 * SubMenu Component
 * Renders individual menu items or collapsible menu groups
 * 
 * @param {object} item - Menu item configuration
 * @param {boolean} isOpen - Whether submenu is expanded
 * @param {function} onToggle - Callback to toggle submenu
 * @param {boolean} isCollapsed - Whether sidebar is collapsed
 * @param {function} onItemClick - Callback when item is clicked
 */
const SubMenu = ({ item, isOpen, onToggle, isCollapsed, onItemClick }) => {
  // Function to truncate the title
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  // Handle click with optional callback
  const handleClick = (callback) => () => {
    if (callback) callback();
    if (onItemClick) onItemClick();
  };

  // 1. If item has a submenu (collapsible group)
  if (item.subNav) {
    return (
      <Box>
        <SidebarToggle onClick={onToggle} component="div">
          {item.icon}
          <SidebarLabel isCollapsed={isCollapsed} component="span">
            {truncate(item.title, 20)}
          </SidebarLabel>
          {!isCollapsed && (
            <ArrowContainer>
              {isOpen ? item.iconOpened : item.iconClosed}
            </ArrowContainer>
          )}
        </SidebarToggle>
        <Collapse in={isOpen && !isCollapsed} timeout={300}>
          {item.subNav.map((subItem, index) => (
            <DropdownLink 
              to={subItem.path} 
              key={index} 
              end
              onClick={handleClick()}
            >
              <SidebarLabel isCollapsed={isCollapsed} component="span">
                {truncate(subItem.title, 20)}
              </SidebarLabel>
            </DropdownLink>
          ))}
        </Collapse>
      </Box>
    );
  }

  // 2. If item has an onClick (e.g., Logout)
  if (item.onClick) {
    return (
      <SidebarButton onClick={handleClick(item.onClick)} component="button">
        {item.icon}
        <SidebarLabel isCollapsed={isCollapsed} component="span">
          {truncate(item.title, 20)}
        </SidebarLabel>
      </SidebarButton>
    );
  }

  // 3. Otherwise, standard navigation link
  return (
    <SidebarNavLink to={item.path || "#"} end onClick={handleClick()}>
      {item.icon}
      <SidebarLabel isCollapsed={isCollapsed} component="span">
        {truncate(item.title, 20)}
      </SidebarLabel>
    </SidebarNavLink>
  );
};

export default SubMenu;
