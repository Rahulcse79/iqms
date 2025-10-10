import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

// A styled NavLink for actual navigation items
// A styled NavLink for actual navigation items
const SidebarNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 10px;
  text-decoration: none;
  font-size: 14px;
  transition: 0.3s;
  white-space: nowrap;
  border-left: 4px solid transparent;

  color: var(--text);
  background: var(--surface);

  &:hover {
    background: var(--glass);
    border-left: 4px solid var(--primary);
  }

  &.active {
    background: var(--bg);
    border-left: 4px solid var(--primary);
  }
`;

// Styled div for toggleable menus (with subNav)
const SidebarToggle = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 10px;
  font-size: 14px;
  transition: 0.3s;
  white-space: nowrap;
  cursor: pointer;
  border-left: 4px solid transparent;

  color: var(--text);

  &:hover {
    background: var(--glass);
    border-left: 4px solid var(--primary);
  }
`;

// Styled button for actions like Logout
const SidebarButton = styled.button`
  display: flex;
  align-items: center;
  padding: 12px 10px;
  font-size: 14px;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  transition: 0.3s;
  white-space: nowrap;
  cursor: pointer;
  border-left: 4px solid transparent;

  color: var(--text);

  &:hover {
    background: var(--glass);
    border-left: 4px solid var(--primary);
  }
`;

const SidebarLabel = styled.span`
  margin-left: 16px;
  display: ${({ isCollapsed }) => (isCollapsed ? "none" : "inline-block")};
`;

const DropdownLink = styled(NavLink)`
  height: 40px;
  padding-left: 3rem;
  display: flex;
  align-items: center;
  text-decoration: none;
  font-size: 12px;
  transition: 0.3s;

  background: var(--surface);
  color: var(--muted);

  &:hover {
    background: var(--glass);
    color: var(--primary);
  }

  &.active {
    background: var(--bg);
    color: var(--primary);
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
