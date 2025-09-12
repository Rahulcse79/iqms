import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import "./DashboardLayout.css";
import useTheme from "../hooks/useTheme";
import { useDispatch } from "react-redux";
import { refreshRepliedQueries } from "../actions/allAction";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const dispatch = useDispatch();

  // theme hook
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(refreshRepliedQueries());
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

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

