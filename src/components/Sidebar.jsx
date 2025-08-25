import React, { useState } from "react";
import styled from "styled-components";
import SidebarDataPage from "./SidebarDataPage";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons";
import SidebarLogo from '../assets/Images/sidebar-logo.png'; // 1. Import the logo

const SidebarNav = styled.nav`
  background-color: #0a0a0a;
  width: ${({ isCollapsed }) => (isCollapsed ? "80px" : "220px")}; /* Adjusted width */
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transition: width 350ms ease-in-out;
  z-index: 10;
  overflow-x: hidden;
`;

// 2. Update SidebarHeader styles for alignment
const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  height: 64px; /* Match topbar height for alignment */
  border-bottom: 1px solid #222;
  white-space: nowrap;
`;

const LogoImg = styled.img`
  height: 32px;
  width: 32px;
  flex-shrink: 0; /* Prevent logo from shrinking */
`;

const HeaderTitle = styled.span`
  margin-left: 12px;
  font-weight: bold;
  font-size: 22px;
  color: #ffffff;
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
    <IconContext.Provider value={{ color: "#fff" }}>
      <SidebarNav isCollapsed={isCollapsed}>
        {/* 3. Conditionally render logo and title */}
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