import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./QueryView.css";
import Comparison from "../Comparison";
import ProfileViewLive from "../ProfileView_Live/ProfileView";
import PORDATA from "../ProfileView/components/PORDataBankTab";
import QueryDetails from "./QueryDetails";
import PersonalDetails from "../ProfileView/components/PersonalDetails";
import GCIHistory from "../ProfileView/components/GCIHistoryTab";
import { fetchPersonalData } from "../../actions/ProfileAction";
import { useDispatch, useSelector } from "react-redux";
import { UserRoleLabel } from "../../constants/Enum";

const STORAGE_KEY = "queryDrafts_v2";

const QueryView = ({ onBack }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const row = location.state?.row || null;

  const [queryType, setQueryType] = useState("Personal Data Issue");

  const dispatch = useDispatch();
  const personalDataState = useSelector((state) => state.personalData);
  const { loading, error, data: personalData } = personalDataState;
  const enableCache = location.pathname.includes("view/query");

  // Unified draft state only for caching
  const [draft, setDraft] = useState({
    replyText: "",
    forwardOption: "",
    transferSection: "",
  });

  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get("category");
  const queryValue = searchParams.get("q");

  // helper: map "Airmen" -> 1, "Officer" -> 0, "Civilian" -> 2
  const getCategoryCode = (category) => {
    const entry = Object.entries(UserRoleLabel).find(
      ([code, label]) => label.toLowerCase() === String(category).toLowerCase()
    );
    return entry ? Number(entry[0]) : null;
  };

  // fetch personal data when category + service no are available
  useEffect(() => {
    if (queryValue && category) {
      const catCode = getCategoryCode(category);
      if (catCode !== null) {
        dispatch(fetchPersonalData(queryValue, catCode));
      }
    }
  }, [queryValue, category, dispatch]);

  // Load draft from localStorage if exists and caching enabled
  useEffect(() => {
    if (enableCache && id) {
      const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (allDrafts[id]) {
        setDraft(allDrafts[id]);
      }
    }
  }, [id, enableCache]);

  const handleClose = () => navigate(-1);

  const renderRightPanel = () => {
    switch (queryType) {
      case "Personal Data Issue":
        return (
          <PersonalDetails
            data={personalData && !error ? personalData : null}
            loading={loading}
            error={
              error || (personalData && personalData.error ? personalData.error : null)
            }
          />
        );
      case "Pay Related Issue":
        return <h2 style={{ color: "var(--text)" }}>Pay Related Issue Page</h2>;
      case "Comparison Issue":
        return <Comparison />;
      case "Allowance Related Issue":
        return <GCIHistory />;
      case "POR Issue":
        return <PORDATA  sno={queryValue}
        cat={getCategoryCode(category)} />;
      case "Profile View":
        return (
          <ProfileViewLive
            category={getCategoryCode(category)}
            queryValue={queryValue}
          />
        );
      default:
        return null;
    }
  };

  if (!row) {
    return (
      <div className="qview-container">
        <div className="qview-card">
          <h3>Query details not found</h3>
          <button className="btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qview-container split-active">
      <button className="close-btn" onClick={handleClose}>
        ✕
      </button>

      {/* Left Panel */}
      <div className="left-panel">
        <QueryDetails
          queryId={id}
          enableCache={enableCache}
          {...(enableCache ? { draft, setDraft } : {})}
          onBack={onBack}
        />
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="form-group">
          <label style={{color:"var(--text)"}}>Type of Query</label>
          <select
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
          >
            <option value="Personal Data Issue">Personal Data Issue</option>
            <option value="Pay Related Issue">Pay Related Issue</option>
            <option value="Comparison Issue">Comparison Issue</option>
            <option value="Allowance Related Issue">Allowance Related Issue</option>
            <option value="POR Issue">POR Issue</option>
            <option value="Profile View">Profile View</option>
          </select>
        </div>

        <div className="panel-content">{renderRightPanel()}</div>
      </div>
    </div>
  );
};

export default QueryView;
