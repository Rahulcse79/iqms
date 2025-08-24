import React, { useState } from "react";
import styled from "styled-components";
import SidebarDataPage from "./SidebarDataPage";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons";

const SidebarNav = styled.nav`
  background-color: #0a0a0a;
  /* Change width based on collapsed state */
  width: ${({ isCollapsed }) => (isCollapsed ? "80px" : "200px")};
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transition: width 350ms ease-in-out; /* Animate the width change */
  z-index: 10;
  overflow-x: hidden; /* Hide overflowing content */
`;

const SidebarHeader = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  border-bottom: 1px solid #222;
  white-space: nowrap; /* Prevent title from wrapping */
`;

const SidebarWrap = styled.div`
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding-top: 10px;
`;

const Sidebar = ({ isCollapsed }) => {
  const SidebarData = SidebarDataPage();
  const [openMenu, setOpenMenu] = useState(null); // Track open dropdown

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  return (
    <IconContext.Provider value={{ color: "#fff" }}>
      <SidebarNav isCollapsed={isCollapsed}>
        <SidebarHeader>{isCollapsed ? "IQMS" : "IQMS"}</SidebarHeader>
        <SidebarWrap>
          {SidebarData.map((item, index) => (
            <SubMenu
              item={item}
              key={index}
              isOpen={openMenu === index}
              onToggle={() => toggleMenu(index)}
              isCollapsed={isCollapsed} /* Pass down the state */
            />
          ))}
        </SidebarWrap>
      </SidebarNav>
    </IconContext.Provider>
  );
};

export default Sidebar;
