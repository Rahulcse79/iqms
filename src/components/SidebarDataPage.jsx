import React from "react";
import {
  FaTachometerAlt,
  FaInbox,
  FaSearch,
  FaUserCircle,
  FaChartBar,
  FaChartLine,
  FaBalanceScale,
  FaChevronDown,
  FaChevronUp,
  FaBookOpen,
  FaPhoneAlt
} from "react-icons/fa";

const SidebarDataPage = () => {

  const SidebarData = [
    {
      title: "Dashboard",
      path: "/",
      icon: <FaTachometerAlt style={{ color: "#4CAF50" }} />,
    },
    {
      title: "View Queries",
      icon: <FaInbox style={{ color: "#2196F3" }} />,
      iconClosed: <FaChevronDown />,
      iconOpened: <FaChevronUp />,
      subNav: [
        {
          title: "Incoming",
          path: "/view/queries/incoming",
        },
        {
          title: "Transferred",
          path: "/view/queries/transferred",
        },
        {
          title: "Replied",
          path: "/view/queries/replied",
        },
      ],
    },
    {
      title: "Search Query",
      path: "/search-query",
      icon: <FaSearch style={{ color: "#FF9800" }} />,
    },
    {
      title: "Profile View",
      path: "/view/profile",
      icon: <FaUserCircle style={{ color: "#9C27B0" }} />,
    },
    {
      title: "MIS",
      icon: <FaInbox style={{ color: "#106425ff" }} />,
      iconClosed: <FaChevronDown />,
      iconOpened: <FaChevronUp />,
      subNav: [
        {
          title: "IQMS MIS",
          path: "/iqms-mis",
        },
        {
          title: "CDR",
          path: "/cdr",
        },
      ],
    },

     {
      title: "Comparision",
      icon: <FaBalanceScale style={{ color: "#2196F3" }} />,
      iconClosed: <FaChevronDown />,
      iconOpened: <FaChevronUp />,
      subNav: [
        {
          title: "Query Comparision",
          path: "/query/comparision",
        },
        {
          title: "Sr./Jr. Comparision",
          path: "/comparision",
        },
      ],
    },
    {
      title: "Freq. Query Count",
      path: "/freq-query",
      icon: <FaChartLine style={{ color: "#E91E63" }} />,
    },
    {
      title: "FAQ's",
      path: "/FAQ",
      icon: <FaBookOpen style={{ color: "#009688" }} />,
    },
    {
      title: "Tasks",
      path: "/interim-reply",
      icon: <FaBookOpen style={{ color: "#009688" }} />,
    },

  ];

  return SidebarData;
};

export default SidebarDataPage;
