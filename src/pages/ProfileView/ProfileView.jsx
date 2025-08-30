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
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPersonalData,
  getRankHistory,
  getTradeHistory,
  getPostingHistory,
} from '../../actions/allAction';
import PersonalDetails from './components/PersonalDetails';

const log = {
  debug: (...args) => process.env.NODE_ENV !== 'production' && console.debug('[ProfileView]', ...args),
  error: (...args) => console.error('[ProfileView]', ...args),
};

const LazyComponent = ({ renderFn }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

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

  return (
    <div ref={ref}>
      {visible ? renderFn() : <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>}
    </div>
  );
};

const SECTIONS = [
  { id: 'pd', label: 'Personal Details', Component: PersonalDetails },
  { id: 'rank', label: 'Rank History', Component: RankHistoryTab },
  { id: 'trade', label: 'Trade History', Component: TradeHistoryTab },
  { id: 'posting', label: 'Posting History', Component: PostingHistoryTab },
  { id: 'gci', label: 'GCI History', Component: GCIHistoryTab },
  { id: 'por', label: 'POR Data Bank', Component: PORDataBankTab },
  { id: 'mvr', label: 'MVR History', Component: MVRHistoryTab },
  { id: 'irla', label: 'IRLA History', Component: IRLAHistoryTab },
  { id: 'iqms', label: 'IQMS details', Component: IQMSDetailsTab },
];

export default function ProfileView() {
  const [serviceNo, setServiceNo] = useState('');
  const [category, setCategory] = useState('1');
  const [showProfile, setShowProfile] = useState(false);
  const sectionRefs = useRef({});

  const dispatch = useDispatch();
  const personalSlice = useSelector((s) => s.personalData || {});
  const userSlice = useSelector((s) => s.user ?? s.login_user ?? {});
  const rankHistory = userSlice.rankHistory || {};
  const tradeHistory = userSlice.tradeHistory || {};
  const postingHistory = userSlice.postingHistory || {};

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!serviceNo.trim()) return alert('Please enter a service number.');

    try {
      setShowProfile(true);
      await dispatch(fetchPersonalData(serviceNo, category));
      dispatch(getRankHistory(serviceNo, category, 1));
      dispatch(getTradeHistory(serviceNo, category, 1));
      dispatch(getPostingHistory(serviceNo, category, 1));
    } catch (err) {
      log.error('Search Error', err);
    }
  };

  const handleDropdownChange = (e) => {
    const id = e.target.value;
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="profile-view-container">
      <SearchSection
        serviceNo={serviceNo}
        setServiceNo={setServiceNo}
        category={category}
        setCategory={setCategory}
        handleSearch={handleSearch}
      />

      {showProfile && (
        <div className="result-section">
          <div className="dropdown-container">
            <select onChange={handleDropdownChange} defaultValue="">
              <option value="" disabled>Select a section</option>
              {SECTIONS.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          <div className="sections-container">
            {SECTIONS.map(({ id, Component, label }) => {
              let tabProps = {};
              if (id === 'rank') tabProps = rankHistory;
              if (id === 'trade') tabProps = tradeHistory;
              if (id === 'posting') tabProps = postingHistory;

              return (
                <div
                  key={id}
                  id={id}
                  ref={(el) => (sectionRefs.current[id] = el)}
                  className="profile-section"
                >
                  <h2 className="section-title">{label}</h2>
                  <div className="section-content">
                    <LazyComponent renderFn={() => (
                      <Component {...tabProps} />
                    )} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
