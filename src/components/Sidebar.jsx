import React, { useState } from "react";
import styled from "styled-components";
import SidebarDataPage from "./SidebarDataPage";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons";
import SidebarLogo from '../assets/Images/sidebar-logo.png';

const SidebarNav = styled.nav`
  background-color: var(--secondary-0);
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
  border-right: 1px solid var(--border);
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-md);
  height: 90px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
`;

const LogoImg = styled.img`
  height: 32px;
  width: 32px;
  flex-shrink: 0;
`;

const HeaderTitle = styled.span`
  margin-left: var(--space-sm);
  font-weight: var(--fw-bold);
  font-size: var(--fs-lg);
  color: var(--text-primary);
`;

const SidebarWrap = styled.div`
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding-top: var(--space-sm);
  
  /* Scrollbar styling (optional, themed) */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: var(--radius-sm);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--primary-200);
  }
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
          {!isCollapsed && <HeaderTitle>IVRS</HeaderTitle>}
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
