import React, { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const SidebarLink = styled(Link)`
  display: flex;
  color: #e1e9fc;
  align-items: center;
  padding: 12px 20px;
  text-decoration: none;
  font-size: 15px;
  transition: 0.3s;

  &:hover {
    background: #252831;
    border-left: 4px solid #61dafb;
    cursor: pointer;
  }
`;

const SidebarLabel = styled.span`
  margin-left: 16px;
`;

const DropdownLink = styled(Link)`
  background: #1a1a1a;
  height: 40px;
  padding-left: 3rem;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #b1b1b1;
  font-size: 14px;
  transition: 0.3s;

  &:hover {
    background: #252831;
    color: #61dafb;
  }
`;

const SubMenu = ({ item }) => {
  const [subnav, setSubnav] = useState(false);

  const showSubnav = () => setSubnav(!subnav);

  return (
    <>
      <SidebarLink to={item.path || "#"} onClick={item.subNav && showSubnav}>
        {item.icon}
        <SidebarLabel>{item.title}</SidebarLabel>
        <div style={{ marginLeft: "auto" }}>
          {item.subNav && (subnav ? item.iconOpened : item.iconClosed)}
        </div>
      </SidebarLink>
      {subnav &&
        item.subNav.map((subItem, index) => (
          <DropdownLink to={subItem.path} key={index}>
            {subItem.icon}
            <SidebarLabel>{subItem.title}</SidebarLabel>
          </DropdownLink>
        ))}
    </>
  );
};

export default SubMenu;
