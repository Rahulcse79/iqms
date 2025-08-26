import React, { useState } from "react";
import styled from "styled-components";
import SidebarDataPage from "./SidebarDataPage";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons";
import SidebarLogo from '../assets/Images/sidebar-logo.png';

const SidebarNav = styled.nav`
  background-color: #ffffff;
  width: ${({ isCollapsed }) => (isCollapsed ? "80px" : "220px")};
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transition: width 350ms ease-in-out;
  z-index: 10;
  overflow-x: hidden;
  border-right: 1px solid #e5e7eb;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 64px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const LogoImg = styled.img`
  height: 32px;
  width: 32px;
  flex-shrink: 0;
`;

const HeaderTitle = styled.span`
  margin-left: 12px;
  font-weight: bold;
  font-size: 22px;
  color: #1f2937;
`;

const SidebarWrap = styled.div`
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding-top: 10px;
`;

const Sidebar = ({ isCollapsed }) => {
  const SidebarData = SidebarDataPage();
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <IconContext.Provider value={{ color: "#374151" }}>
      <SidebarNav isCollapsed={isCollapsed}>
        <SidebarHeader>
          <LogoImg src={SidebarLogo} alt="IQMS Logo" />
          {!isCollapsed && <HeaderTitle>IQMS</HeaderTitle>}
        </SidebarHeader>
        <SidebarWrap>
          {SidebarData.map((item, index) => (
            <SubMenu
              item={item}
              key={index}
              isOpen={openMenu === index}
              onToggle={() => toggleMenu(index)}
              isCollapsed={isCollapsed}
            />
          ))}
        </SidebarWrap>
      </SidebarNav>
    </IconContext.Provider>
  );
};

export default Sidebar;
