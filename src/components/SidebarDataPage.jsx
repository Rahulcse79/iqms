import React from 'react';
import {
  FaTachometerAlt,
  FaInbox,
  FaSearch,
  FaUserCircle,
  FaChartBar,
  FaChartLine,
  FaBalanceScale,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

const SidebarDataPage = () => {
  const SidebarData = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <FaTachometerAlt style={{ color: '#4CAF50' }} />
    },
    {
      title: 'View Queries',
      icon: <FaInbox style={{ color: '#2196F3' }} />,
      iconClosed: <FaChevronDown />,
      iconOpened: <FaChevronUp />,
      subNav: [
        {
          title: 'Incoming',
          path: '/view/queries/incoming',
        },
        {
          title: 'Transferred',
          path: '/view/queries/transferred',
        },
        {
          title: 'Replied',
          path: '/view/queries/replied',
        }
      ]
    },
    {
      title: 'Search Query',
      path: '/search-query',
      icon: <FaSearch style={{ color: '#FF9800' }} />
    },
    {
      title: 'Profile View',
      path: '/view/profile',
      icon: <FaUserCircle style={{ color: '#9C27B0' }} />
    },
    {
      title: 'IQMS MIS',
      path: '/iqms-mis',
      icon: <FaChartBar style={{ color: '#673AB7' }} />
    },
    {
      title: 'Freq. Query Count',
      path: '/freq-query',
      icon: <FaChartLine style={{ color: '#E91E63' }} />
    },
    {
      title: 'Senior/Junior Comparision',
      path: '/comparision',
      icon: <FaBalanceScale style={{ color: '#009688' }} />
    },
    {
      title: 'Validation',
      path: '/validation',
      icon: <FaCheckCircle style={{ color: '#F44336' }} />
    }
  ];

  return SidebarData;
};

export default SidebarDataPage;
