import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./DashboardLayout.css";
import useTheme from "../hooks/useTheme";
import useIdleLogout from "../hooks/useIdleLogout";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  // Install the idle-logout hook for the whole dashboard area (default 5 minutes)
  useIdleLogout();

  
  // theme hook
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div
      className={`dashboard-layout ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div className="main-content">
        <Topbar
          className="topbar"
          toggleSidebar={toggleSidebar}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main className="content">
          <Outlet key={location.pathname + location.search} />
        </main>

        {/* <Footer className="footer" /> */}
      </div>
    </div>
  );
};

export default DashboardLayout;
