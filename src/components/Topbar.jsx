import React, { useState } from 'react';
import { RiMenuFill } from 'react-icons/ri';
import './Topbar.css';

const Topbar = ({ toggleSidebar }) => {
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [searchValue, setSearchValue] = useState('');
  const [selectedSection, setSelectedSection] = useState('Airman');

  // Hardcoded user info (replace with real data later)
  const userInfo = {
    name: 'John Doe',
    designation: 'System Admin',
    email: 'john.doe@example.com'
  };

  const roles = [
    'Admin', 'Manager', 'Operator', 'Viewer', 'Supervisor',
    'Coordinator', 'Technician', 'Guest'
  ];

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    console.log('Switched to role:', e.target.value);
  };

  const handleSearch = () => {
    console.log(`Searching for "${searchValue}" in ${selectedSection}`);
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Left: Toggle Sidebar & Title */}
        <div className="topbar-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <RiMenuFill />
          </button>
          <label htmlFor="roleDropdown">Switch Role: </label>
          <select
            id="roleDropdown"
            value={selectedRole}
            onChange={handleRoleChange}
          >
            {roles.map((role, index) => (
              <option key={index} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Center: Search */}
        <div className="topbar-center">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <option value="Airman">Airman</option>
          </select>
          <input
            type="text"
            placeholder="Search by Service/Query ID"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {/* Right: User Info */}
        <div className="topbar-right">
          <div className="user-info">
            <span className="user-name">{userInfo.name}</span>
            <span className="user-designation">{userInfo.designation}</span>
            <span className="user-email">{userInfo.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
