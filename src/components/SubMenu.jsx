import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";

// A styled NavLink for actual navigation items
const SidebarNavLink = styled(NavLink)`
  display: flex;
  color: #e1e9fc;
  align-items: center;
  padding: 12px 10px;
  text-decoration: none;
  font-size: 14px;
  transition: 0.3s;
  white-space: nowrap;
  border-left: 4px solid transparent; /* Default state */

  &:hover {
    background: #252831;
    border-left: 4px solid #61dafb;
    cursor: pointer;
  }

  /* This class is applied by NavLink on an active route */
  &.active {
    background: #252831;
    border-left: 4px solid #61dafb;
  }
`;

// A styled div for items that are just dropdown toggles
const SidebarToggle = styled.div`
  display: flex;
  color: #e1e9fc;
  align-items: center;
  padding: 12px 10px;
  text-decoration: none;
  font-size: 14px;
  transition: 0.3s;
  white-space: nowrap;
  cursor: pointer;
  border-left: 4px solid transparent; /* Default state */

  &:hover {
    background: #252831;
    border-left: 4px solid #61dafb;
  }
`;

const SidebarLabel = styled.span`
  margin-left: 16px;
  /* Hide the label when collapsed */
  display: ${({ isCollapsed }) => (isCollapsed ? "none" : "inline-block")};
`;

const DropdownLink = styled(NavLink)`
  background: #1a1a1a;
  height: 40px;
  padding-left: 3rem;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #b1b1b1;
  font-size: 12px;
  transition: 0.3s;

  &:hover {
    background: #252831;
    color: #61dafb;
  }

  &.active {
    background: #252831;
    color: #61dafb;
  }
`;

const SubMenu = ({ item, isOpen, onToggle, isCollapsed }) => {
  // Function to truncate the title
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  // If the item has a submenu, render it as a toggle button (div)
  if (item.subNav) {
    return (
      <>
        <SidebarToggle onClick={onToggle}>
          {item.icon}
          <SidebarLabel isCollapsed={isCollapsed}>
            {truncate(item.title, 20)}
          </SidebarLabel>
          <div style={{ marginLeft: "auto" }}>
            {item.subNav &&
              !isCollapsed &&
              (isOpen ? item.iconOpened : item.iconClosed)}
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

  // Otherwise, render it as a standard navigation link
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