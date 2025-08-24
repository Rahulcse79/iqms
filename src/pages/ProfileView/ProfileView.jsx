import React, { useState } from 'react';
import './ProfileView.css';
import GCIHistoryTab from './components/GCIHistoryTab';
import RankHistoryTab from './components/RankHistoryTab';
import TradeHistoryTab from './components/TradeHistoryTab';
import PostingHistoryTab from './components/PostingHistoryTab';
import PORDataBankTab from './components/PORDataBankTab';
import MVRHistoryTab from './components/MVRHistoryTab';
import IRLAHistoryTab from './components/IRLAHistoryTab';
import IQMSDetailsTab from './components/IQMSdetailsTab';
import SearchSection from './components/SearchSection';

const profileData = {
  serviceNo: '789123-A',
  rank: 'Sgt',
  name: 'John Doe',
  trade: 'Air-Frame Fitter',
};

const TABS = [
  'GCI History', 'Rank History', 'Trade History', 'Posting History',
  'POR Data Bank', 'MVR History', 'IRLA History', 'IQMS details'
];
export default function ProfileView() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [serviceNo, setServiceNo] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (serviceNo.trim()) {
      setShowProfile(true);
    } else {
      alert('Please enter a service number.');
    }
  };

  const tabComponents = {
    'GCI History': <GCIHistoryTab />,
    'Rank History': <RankHistoryTab />,
    'Trade History': <TradeHistoryTab />,
    'Posting History': <PostingHistoryTab />,
    'POR Data Bank': <PORDataBankTab />,
    'MVR History': <MVRHistoryTab />,
    'IRLA History': <IRLAHistoryTab />,
    'IQMS details': <IQMSDetailsTab />,
  };

  return (
    <div className="profile-view-container">
      <SearchSection
        serviceNo={serviceNo}
        setServiceNo={setServiceNo}
        handleSearch={handleSearch}
      />

      {showProfile && (
        <div className="result-section">
          {/* Removed static profile header */}

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

          {/* Display tab's component UI only */}
          <div className="tab-content">
            {tabComponents[activeTab] || null}
          </div>
        </div>
      )}
    </div>
  );
}
