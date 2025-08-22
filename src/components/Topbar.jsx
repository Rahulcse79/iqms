import React from 'react';
import './Topbar.css';

const Topbar = () => {
  return (
    <header className="topbar">
      <div className="topbar-content">
        <h1>Welcome, Admin</h1>
        {/* Add other topbar items here, like notifications, user profile, etc. */}
      </div>
    </header>
  );
};

export default Topbar;
