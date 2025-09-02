// src/layouts/DashboardLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import "./DashboardLayout.css";
import Dialpad from "../components/Dialpad/Dialpad";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { refreshRepliedQueries } from "../actions/allAction";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const dispatch = useDispatch();

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(refreshRepliedQueries());
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

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
