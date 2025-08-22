import React from "react";
import styled from "styled-components";
import SidebarDataPage from "./SidebarDataPage";
import SubMenu from "./SubMenu"; 
import { IconContext } from "react-icons/lib";

const SidebarNav = styled.nav`
  background-color: #0a0a0a;
  width: 240px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  transition: 350ms;
  z-index: 10;
`;

const SidebarWrap = styled.div`
  width: 100%;
  flex: 1;
  overflow-y: auto;
`;


const SidebarTextContainer = styled.div`
  margin-top: auto;
  padding: 15px;
  text-align: center;
  color: #e1e9fc;
`;

const SidebarText = styled.p`
  margin: 4px 0;
  font-size: 12px;
`;

const Sidebar = () => {
  const SidebarData = SidebarDataPage();

  return (
    <IconContext.Provider value={{ color: "#fff" }}>
      <SidebarNav>
        <SidebarWrap>
          {SidebarData.map((item, index) => (
            <SubMenu item={item} key={index} />
          ))}
        </SidebarWrap>
        <SidebarTextContainer>
          <SidebarText>IQMS System</SidebarText>
          <SidebarText>Version - 1.0</SidebarText>
        </SidebarTextContainer>
      </SidebarNav>
    </IconContext.Provider>
  );
};

export default Sidebar;
