import React, { useState, useEffect, useMemo } from "react";
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

/* ----------------------------------
   Helpers
----------------------------------- */

const parseRankDate = (r) => {
  const d = r?.hp_date || r?.wef;
  if (!d) return null;
  return new Date(d);
};

const sortRankList = (list, dir) => {
  if (!dir) return list;

  return [...list].sort((a, b) => {
    const da = parseRankDate(a);
    const db = parseRankDate(b);

    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;

    return dir === "asc" ? da - db : db - da;
  });
};

/* ----------------------------------
   Rank History Table (sortable)
----------------------------------- */
const RankHistoryTable = ({ rankList }) => {
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = () => {
    setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const sortedList = useMemo(
    () => sortRankList(rankList, sortDir),
    [rankList, sortDir],
  );

  if (sortedList.length === 0) {
    return <p>No rank history.</p>;
  }

  return (
    <table className="rank-table">
      <thead>
        <tr>
          <th>S No.</th>
          <th>Rank</th>
          <th
            onClick={toggleSort}
            style={{ cursor: "pointer", userSelect: "none" }}
            title="Click to sort by date"
          >
            Date {sortDir === "asc" ? "▲" : sortDir === "desc" ? "▼" : ""}
          </th>
          <th>Type</th>
          <th>Opt</th>
        </tr>
      </thead>
      <tbody>
        {sortedList.map((r, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{r.rank ?? "-"}</td>
            <td>{r.hp_date || r.wef || "-"}</td>
            <td>{r.type ?? "-"}</td>
            <td>{r.opt ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* ----------------------------------
   Main Component
----------------------------------- */
const Comparison = () => {
  const dispatch = useDispatch();

  const [seniorServiceNumber, setSeniorServiceNumber] = useState("");
  const [juniorServiceNumber, setJuniorServiceNumber] = useState("");
  const [selectCategory, setSelectCategory] = useState("Airmen");
  const [result, setResult] = useState(null);

  /* ---------- Redux slices ---------- */
  const airmanPersmastSlice = useSelector((s) => s.airmanPersmast);
  const airmanBasicPaySlice = useSelector((s) => s.airmanBasicPayReason);
  const airmanRankSlice = useSelector((s) => s.airmanRankHistory);

  const officerPersmastSlice = useSelector((s) => s.officerPersmast);
  const officerBasicPaySlice = useSelector((s) => s.officerBasicPayReason);
  const officerRankSlice = useSelector((s) => s.officerRankHistory);

  const getFromSlice = (slice, sno) =>
    slice?.data && sno ? (slice.data[sno] ?? null) : null;

  /* ---------- Search ---------- */
  const handleSearch = (e) => {
    e.preventDefault();

    if (!seniorServiceNumber || !juniorServiceNumber) {
      alert("Please fill in all fields before searching.");
      return;
    }

    const isOfficer = selectCategory === "Officer";

    const fetch = isOfficer
      ? {
          pers: fetchOfficerPersmast,
          pay: fetchOfficerBasicPayReason,
          rank: fetchOfficerRankHistory,
        }
      : {
          pers: fetchAirmanPersmast,
          pay: fetchAirmanBasicPayReason,
          rank: fetchAirmanRankHistory,
        };

    [seniorServiceNumber, juniorServiceNumber].forEach((sno) => {
      dispatch(fetch.pers(sno));
      dispatch(fetch.pay(sno));
      dispatch(fetch.rank(sno));
    });

    setResult({
      category: selectCategory,
      senior: seniorServiceNumber,
      junior: juniorServiceNumber,
    });

    setTimeout(() => {
      document
        .querySelector(".comparison-results")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const printReport = () => window.print();

  /* ---------- Normalizers ---------- */
  const normalizePers = (d) =>
    !d ? null : d.sno || d.p_name ? d : (d.items?.[0] ?? null);

  const normalizeArray = (d) =>
    Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [];

  const pickSlice = (off, air, sno) =>
    selectCategory === "Officer"
      ? getFromSlice(off, sno)
      : getFromSlice(air, sno);

  /* ---------- Data ---------- */
  const seniorPerson = normalizePers(
    pickSlice(officerPersmastSlice, airmanPersmastSlice, result?.senior),
  );
  const juniorPerson = normalizePers(
    pickSlice(officerPersmastSlice, airmanPersmastSlice, result?.junior),
  );

  const seniorRankList = normalizeArray(
    pickSlice(officerRankSlice, airmanRankSlice, result?.senior),
  );
  const juniorRankList = normalizeArray(
    pickSlice(officerRankSlice, airmanRankSlice, result?.junior),
  );

  const seniorPayList = normalizeArray(
    pickSlice(officerBasicPaySlice, airmanBasicPaySlice, result?.senior),
  );
  const juniorPayList = normalizeArray(
    pickSlice(officerBasicPaySlice, airmanBasicPaySlice, result?.junior),
  );

  /* ---------- Card ---------- */
  const renderCard = (person, rankList, payList, label) => {
    if (!person && rankList.length === 0 && payList.length === 0) {
      return <div className="card-comparision">{label}: No Data Found</div>;
    }

    return (
      <div>
        <div className="card-top">
          {label} • {person?.sno || "-"}
        </div>

        <div className="card-body">
          <div className="section-title">Rank History</div>
          <RankHistoryTable rankList={rankList} />

          <div className="section-title">Basic Pay Reason</div>
          {payList.length === 0 ? (
            <p>No pay entries.</p>
          ) : (
            <table className="info-table">
              <thead>
                <tr>
                  <th>S No.</th>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>WEF</th>
                </tr>
              </thead>
              <tbody>
                {payList.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{p.description ?? p.desc ?? "-"}</td>
                    <td>{p.rate ?? p.amount ?? "-"}</td>
                    <td>{p.wef || p.hp_date || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  /* ---------- UI ---------- */
  return (
    <div className="comparison-container">
      <h2>Comparative Statement</h2>

      <form className="comparison-form" onSubmit={handleSearch}>
        <label>
          Select Category
          <select
            value={selectCategory}
            onChange={(e) => setSelectCategory(e.target.value)}
          >
            <option value="Airmen">Airmen</option>
            <option value="Officer">Officer</option>
          </select>
        </label>

        <div className="label-searchbox">
          <label>
            Senior Service Number
            <input
              value={seniorServiceNumber}
              onChange={(e) => setSeniorServiceNumber(e.target.value.trim())}
            />
          </label>

          <label>
            Junior Service Number
            <input
              value={juniorServiceNumber}
              onChange={(e) => setJuniorServiceNumber(e.target.value.trim())}
            />
          </label>
        </div>

        <button type="submit" className="search-btn">
          Create Comparative Statement
        </button>
      </form>

      {result && (
        <div className="comparison-results">
          <div className="results-header">
            <button className="print-btn" onClick={printReport}>
              Print Report
            </button>
          </div>

          <div className="cards">
            {renderCard(seniorPerson, seniorRankList, seniorPayList, "Senior")}
            {renderCard(juniorPerson, juniorRankList, juniorPayList, "Junior")}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comparison;
