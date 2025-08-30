// src/layouts/DashboardLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import "./DashboardLayout.css";
import Dialpad from "../components/Dialpad/Dialpad";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div
      className={`dashboard-layout ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <div className="main-content">
        <Topbar className="topbar" toggleSidebar={toggleSidebar} />
        <Dialpad className="dialpad" />
        <main className="content">
          <Outlet />
        </main>
        <Footer className="footer" />
      </div>
    </div>
  );
};

export default DashboardLayout;
