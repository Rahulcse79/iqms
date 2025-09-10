import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

// A styled NavLink for actual navigation items
const SidebarNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-xs);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-secondary);
  text-decoration: none;
  white-space: nowrap;
  border-left: 4px solid transparent;
  border-radius: var(--radius-sm);
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;

  &:hover {
    background: var(--surface-2);
    border-left: 4px solid var(--primary-500);
    color: var(--text-primary);
    cursor: pointer;
  }

  &.active {
    background: var(--surface-3);
    border-left: 4px solid var(--primary-500);
    color: var(--primary-600);
  }
`;

// Styled div for toggleable menus (with subNav)
const SidebarToggle = styled.div`
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-xs);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-secondary);
  white-space: nowrap;
  cursor: pointer;
  border-left: 4px solid transparent;
  border-radius: var(--radius-sm);
  transition: background-color 0.25s ease, border-color 0.25s ease;

  &:hover {
    background: var(--surface-2);
    border-left: 4px solid var(--primary-500);
    color: var(--text-primary);
  }
`;

// Styled button for actions like Logout
const SidebarButton = styled.button`
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-xs);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  border-left: 4px solid transparent;
  border-radius: var(--radius-sm);
  transition: background-color 0.25s ease, border-color 0.25s ease;

  &:hover {
    background: var(--surface-2);
    border-left: 4px solid var(--primary-500);
    color: var(--text-primary);
  }
`;

const SidebarLabel = styled.span`
  margin-left: var(--space-sm);
  display: ${({ isCollapsed }) => (isCollapsed ? "none" : "inline-block")};
  font-size: var(--fs-sm);
  color: var(--text-secondary);
`;

// Dropdown links (for submenus)
const DropdownLink = styled(NavLink)`
  background: var(--surface-2);
  height: 40px;
  padding-left: calc(var(--space-lg) + 1rem);
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-tertiary);
  font-size: var(--fs-xs);
  transition: background-color 0.25s ease, color 0.25s ease;

  &:hover {
    background: var(--surface-3);
    color: var(--primary-500);
  }

  &.active {
    background: var(--surface-3);
    color: var(--primary-600);
  }
`;


const SubMenu = ({ item, isOpen, onToggle, isCollapsed }) => {
  // Function to truncate the title
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  // 1. If item has a submenu (collapsible group)
  if (item.subNav) {
    return (
      <>
        <SidebarToggle onClick={onToggle}>
          {item.icon}
          <SidebarLabel isCollapsed={isCollapsed}>
            {truncate(item.title, 20)}
          </SidebarLabel>
          <div style={{ marginLeft: "auto" }}>
            {!isCollapsed && (isOpen ? item.iconOpened : item.iconClosed)}
          </div>
        </SidebarToggle>
        {isOpen &&
          !isCollapsed &&
          item.subNav.map((subItem, index) => (
            <DropdownLink to={subItem.path} key={index} end>
              <SidebarLabel isCollapsed={isCollapsed}>
                {truncate(subItem.title, 20)}
              </SidebarLabel>
            </DropdownLink>
          ))}
      </>
    );
  }

  // 2. If item has an onClick (e.g., Logout)
  if (item.onClick) {
    return (
      <SidebarButton onClick={item.onClick}>
        {item.icon}
        <SidebarLabel isCollapsed={isCollapsed}>
          {truncate(item.title, 20)}
        </SidebarLabel>
      </SidebarButton>
    );
  }

  // 3. Otherwise, standard navigation link
  return (
    <SidebarNavLink to={item.path || "#"} end>
      {item.icon}
      <SidebarLabel isCollapsed={isCollapsed}>
        {truncate(item.title, 20)}
      </SidebarLabel>
    </SidebarNavLink>
  );
};

export default SubMenu;
