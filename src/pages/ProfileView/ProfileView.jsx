import React, { useState, useRef, useEffect } from 'react';
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

// Lazy Loader Component
const LazyComponent = ({ Component }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{visible ? <Component /> : <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}</div>;
};

const SECTIONS = [
  { id: 'gci', label: 'GCI History', Component: GCIHistoryTab },
  { id: 'rank', label: 'Rank History', Component: RankHistoryTab },
  { id: 'trade', label: 'Trade History', Component: TradeHistoryTab },
  { id: 'posting', label: 'Posting History', Component: PostingHistoryTab },
  { id: 'por', label: 'POR Data Bank', Component: PORDataBankTab },
  { id: 'mvr', label: 'MVR History', Component: MVRHistoryTab },
  { id: 'irla', label: 'IRLA History', Component: IRLAHistoryTab },
  { id: 'iqms', label: 'IQMS details', Component: IQMSDetailsTab },
];

export default function ProfileView() {
  const [serviceNo, setServiceNo] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const sectionRefs = useRef({});

  const handleSearch = (e) => {
    e.preventDefault();
    if (serviceNo.trim()) {
      setShowProfile(true);
    } else {
      alert('Please enter a service number.');
    }
  };

  const handleDropdownChange = (e) => {
    const sectionId = e.target.value;
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth' });
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
          {/* Dropdown Navigation */}
          <div className="dropdown-container">
            <select onChange={handleDropdownChange} defaultValue="">
              <option value="" disabled>Select a section</option>
              {SECTIONS.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Scrollable Sections with Lazy Loading */}
          <div className="sections-container">
            {SECTIONS.map(({ id, Component, label }) => (
              <div
                key={id}
                id={id}
                ref={el => (sectionRefs.current[id] = el)}
                className="profile-section"
              >
                <h2 className="section-title">{label}</h2>
                <div className="section-content">
                  <LazyComponent Component={Component} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
