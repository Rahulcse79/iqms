import React, { useState } from "react";
import "./Comparison.css";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOfficerBasicPayReason,
  fetchOfficerRankHistory,
  fetchOfficerPersmast,
  fetchAirmanBasicPayReason,
  fetchAirmanRankHistory,
  fetchAirmanPersmast,
} from "../actions/allAction";

const Comparison = () => {
  const dispatch = useDispatch();

  const [seniorServiceNumber, setSeniorServiceNumber] = useState("");
  const [juniorServiceNumber, setJuniorServiceNumber] = useState("");
  const [selectCategory, setSelectCategory] = useState("Airmen");
  const [result, setResult] = useState(null);

  // Officer states
  const officerBasicPayReason = useSelector((state) => state.officerBasicPayReason);
  const officerRankHistory = useSelector((state) => state.officerRankHistory);
  const officerPersmast = useSelector((state) => state.officerPersmast);

  // Airman states
  const airmanBasicPayReason = useSelector((state) => state.airmanBasicPayReason);
  const airmanRankHistory = useSelector((state) => state.airmanRankHistory);
  const airmanPersmast = useSelector((state) => state.airmanPersmast);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!seniorServiceNumber || !juniorServiceNumber || !selectCategory) {
      alert("Please fill in all fields before searching.");
      return;
    }

    if (selectCategory === "Officer") {
      dispatch(fetchOfficerBasicPayReason(seniorServiceNumber));
      dispatch(fetchOfficerRankHistory(seniorServiceNumber));
      dispatch(fetchOfficerPersmast(seniorServiceNumber));
    } else if (selectCategory === "Airmen") {
      dispatch(fetchAirmanBasicPayReason(seniorServiceNumber));
      dispatch(fetchAirmanRankHistory(seniorServiceNumber));
      dispatch(fetchAirmanPersmast(seniorServiceNumber));
    }

    setResult({ category: selectCategory, senior: seniorServiceNumber, junior: juniorServiceNumber });

    setTimeout(() => {
      const el = document.querySelector(".comparison-results");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const printReport = () => {
    window.print();
  };

  const renderCard = (person, payReason, rankHistory, label) => {
    if (!person) return <div className="card">{label}: No Data Found</div>;

    return (
      <div className="card">
        <div className="card-top">
          {label} • {person.serviceNo}
        </div>
        <div className="card-body">
          <div className="card-title">PERSMAST</div>
          <table className="info-table">
            <tbody>
              <tr>
                <td>Cell No</td>
                <td>{person.cellNo || "-"}</td>
                <td>Unit</td>
                <td>{person.unit || "-"}</td>
              </tr>
              <tr>
                <td>Service No</td>
                <td>{person.serviceNo}</td>
                <td>Rank</td>
                <td>{person.rank || "-"}</td>
              </tr>
              <tr>
                <td>Trade</td>
                <td>{person.trade || "-"}</td>
                <td>DOE</td>
                <td>{person.doe || "-"}</td>
              </tr>
              <tr>
                <td>Name</td>
                <td colSpan="3">{person.name || "-"}</td>
              </tr>
            </tbody>
          </table>

          <div className="section-title">Basic Pay Reason</div>
          <ul>
            {(payReason || []).map((pr, idx) => (
              <li key={idx}>
                {pr.reason} – {pr.amount}
              </li>
            ))}
          </ul>

          <div className="section-title">RANK HISTORY</div>
          <table className="rank-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Rank</th>
                <th>Rank Date</th>
              </tr>
            </thead>
            <tbody>
              {(rankHistory || []).map((r, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{r.rank}</td>
                  <td>{r.rankDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // choose correct data
  let seniorData, juniorData, seniorPay, juniorPay, seniorRankHistory, juniorRankHistory;

  if (selectCategory === "Officer") {
    seniorData = officerPersmast[seniorServiceNumber];
    juniorData = officerPersmast[juniorServiceNumber];
    seniorPay = officerBasicPayReason[seniorServiceNumber];
    juniorPay = officerBasicPayReason[juniorServiceNumber];
    seniorRankHistory = officerRankHistory[seniorServiceNumber];
    juniorRankHistory = officerRankHistory[juniorServiceNumber];
  } else if (selectCategory === "Airmen") {
    seniorData = airmanPersmast[seniorServiceNumber];
    juniorData = airmanPersmast[juniorServiceNumber];
    seniorPay = airmanBasicPayReason[seniorServiceNumber];
    juniorPay = airmanBasicPayReason[juniorServiceNumber];
    seniorRankHistory = airmanRankHistory[seniorServiceNumber];
    juniorRankHistory = airmanRankHistory[juniorServiceNumber];
  }

  return (
    <div className="comparison-container">
      <h2>Comparative Statement</h2>

      <form className="comparison-form" onSubmit={handleSearch}>
        <label>
          Select Category
          <select value={selectCategory} onChange={(e) => setSelectCategory(e.target.value)}>
            <option value="Airmen">Airmen / NCs(E)</option>
            <option value="Officer">Officer</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Senior Service Number
          <input
            type="text"
            placeholder="Enter Senior Service No"
            value={seniorServiceNumber}
            onChange={(e) => setSeniorServiceNumber(e.target.value)}
          />
        </label>

        <label>
          Junior Service Number
          <input
            type="text"
            placeholder="Enter Junior Service No"
            value={juniorServiceNumber}
            onChange={(e) => setJuniorServiceNumber(e.target.value)}
          />
        </label>

        <button type="submit" className="search-btn">
          Create Comparative Statement
        </button>
      </form>

      {result && (
        <div className="comparison-results">
          <div className="results-header">
            <h3>Pay Comparative Statement ({result.category})</h3>
            <button className="print-btn" onClick={printReport}>
              Print Report
            </button>
          </div>

          <div className="cards">
            {renderCard(seniorData, seniorPay, seniorRankHistory, "Senior")}
            {renderCard(juniorData, juniorPay, juniorRankHistory, "Junior")}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comparison;
