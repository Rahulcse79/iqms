import React from 'react';
import { FaInbox, FaSearch, FaChartBar, FaListAlt, FaCheckCircle } from 'react-icons/fa';

const SidebarDataPage = () => {
  const SidebarData = [
    {
      title: 'View Incoming Queries',
      path: '/view/income/queries',
      icon: <FaInbox style={{ color: '#4CAF50' }} />
    },
    {
      title: 'Search Query',
      path: '/search-query',
      icon: <FaSearch style={{ color: '#2196F3' }} />
    },
    {
      title: 'IQMS MIS',
      path: '/iqms-mis',
      icon: <FaChartBar style={{ color: '#FF9800' }} />
    },
    {
      title: 'Freq. Query Count',
      path: '/freq-query',
      icon: <FaChartBar style={{ color: '#9C27B0' }} />
    },
    {
      title: 'Senior/Junior Comparision',
      path: '/comparision',
      icon: <FaListAlt style={{ color: '#9C27B0' }} />
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
