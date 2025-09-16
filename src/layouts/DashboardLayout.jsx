import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./DashboardLayout.css";
import useTheme from "../hooks/useTheme";
import { useDataRefresher } from '../hooks/useDataRefresher';

const DashboardLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  
  // Background data refresher
  useDataRefresher();

  // theme hook
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`dashboard-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div className="main-content">
        {/* Pass theme & toggleTheme to Topbar if you want the toggle displayed there */}
        <Topbar className="topbar" toggleSidebar={toggleSidebar} theme={theme} toggleTheme={toggleTheme} />

        <main className="content">
          <Outlet />
        </main>

        {/* <Footer className="footer" /> */}
      </div>
    </div>
  );
};

export default DashboardLayout;

