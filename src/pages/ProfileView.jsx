import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProfileView.css';

// --- DUMMY DATA ---


const profileData = {
  serviceNo: '789123-A',
  rank: 'Sgt',
  name: 'John Doe',
  trade: 'Air-Frame Fitter',
};

const tableData = {
  gci: [
    { date: '2023-01-15', type: 'Annual', result: 'Passed' },
    { date: '2022-01-20', type: 'Annual', result: 'Passed' },
  ],
  rank: [
    { date: '2021-07-01', rank: 'Sgt', authority: 'RO/21/2021' },
    { date: '2018-07-01', rank: 'Cpl', authority: 'RO/18/2018' },
  ],
  trade: [
    { date: '2017-06-12', trade: 'Air-Frame Fitter', course: 'TTC-123' },
  ],
  posting: [
    { date: '2020-05-10', unit: '2 Wing', location: 'Pune' },
    { date: '2017-06-12', unit: '11 Wing', location: 'Mumbai' },
  ],
};

const TABS = [
  'GCI History', 'Rank History', 'Trade History', 'Posting History',
  'POR Data Bank', 'MVR History', 'IRLA History', 'IQMS details'
];

// --- CHILD COMPONENTS ---



const HistoryTable = ({ data, headers }) => (
  <div className="table-container">
    <table>
      <thead>
        <tr>
          {headers.map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {headers.map(h => <td key={h}>{row[h.toLowerCase()]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- MAIN COMPONENT ---

const ProfileView = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [serviceNo, setServiceNo] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (serviceNo.trim()) {
      // In a real app, you would fetch data here.
      // For this demo, we'll just set a flag to show the profile.
      setShowProfile(true);
    } else {
      alert('Please enter a service number.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'GCI History':
        return <HistoryTable data={tableData.gci} headers={['Date', 'Type', 'Result']} />;
      case 'Rank History':
        return <HistoryTable data={tableData.rank} headers={['Date', 'Rank', 'Authority']} />;
      case 'Trade History':
        return <HistoryTable data={tableData.trade} headers={['Date', 'Trade', 'Course']} />;
      case 'Posting History':
        return <HistoryTable data={tableData.posting} headers={['Date', 'Unit', 'Location']} />;
      default:
        return <div className="placeholder-content">Data for {activeTab} will be displayed here.</div>;
    }
  };

  return (
    <div className="profile-view-container">
      {/* --- Search Section --- */}
      <form className="search-section" onSubmit={handleSearch}>
        <div className="form-group">
          <label htmlFor="system">System</label>
          <select id="system" defaultValue="LIVE">
            <option>LIVE</option>
            <option>NC</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" defaultValue="Airmen">
            <option>Airmen</option>
            <option>Officer</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="service-no">Enter Service Number</label>
          <input
            type="text"
            id="service-no"
            placeholder="e.g., 789123-A"
            value={serviceNo}
            onChange={(e) => setServiceNo(e.target.value)}
          />
        </div>
        <button type="submit" className="submit-btn">Submit</button>
      </form>

      {/* --- Conditionally Rendered Result Section --- */}
      {showProfile && (
        <>

          {/* --- Profile and Tabs Section --- */}
          <div className="result-section">
            <div className="profile-header">
              <span>Service No: <strong>{profileData.serviceNo}</strong></span>
              <span>Rank: <strong>{profileData.rank}</strong></span>
              <span>Name: <strong>{profileData.name}</strong></span>
              <span>Trade: <strong>{profileData.trade}</strong></span>
            </div>

            <div className="tabs-container">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {renderTabContent()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileView;
