import React, { useState, useEffect } from "react";
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

  // global slices (reducers should have shape: { data: { [sno]: payload }, loading, error })
  const airmanPersmastSlice = useSelector((state) => state.airmanPersmast);
  const airmanBasicPaySlice = useSelector(
    (state) => state.airmanBasicPayReason
  );
  const airmanRankSlice = useSelector((state) => state.airmanRankHistory);

  const officerPersmastSlice = useSelector((state) => state.officerPersmast);
  const officerBasicPaySlice = useSelector(
    (state) => state.officerBasicPayReason
  );
  const officerRankSlice = useSelector((state) => state.officerRankHistory);

  // helper to read keyed-by-sno from slice safely
  const getFromSlice = (slice, sno) => {
    if (!slice || !sno) return null;
    // slice.data might be undefined initially
    return slice.data ? slice.data[sno] ?? null : null;
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (!seniorServiceNumber || !juniorServiceNumber) {
      alert("Please fill in all fields before searching.");
      return;
    }

    if (selectCategory === "Officer") {
      // Senior
      dispatch(fetchOfficerPersmast(seniorServiceNumber));
      dispatch(fetchOfficerBasicPayReason(seniorServiceNumber));
      dispatch(fetchOfficerRankHistory(seniorServiceNumber));
      // Junior
      dispatch(fetchOfficerPersmast(juniorServiceNumber));
      dispatch(fetchOfficerBasicPayReason(juniorServiceNumber));
      dispatch(fetchOfficerRankHistory(juniorServiceNumber));
    } else {
      // Airmen
      dispatch(fetchAirmanPersmast(seniorServiceNumber));
      dispatch(fetchAirmanBasicPayReason(seniorServiceNumber));
      dispatch(fetchAirmanRankHistory(seniorServiceNumber));
      // Junior
      dispatch(fetchAirmanPersmast(juniorServiceNumber));
      dispatch(fetchAirmanBasicPayReason(juniorServiceNumber));
      dispatch(fetchAirmanRankHistory(juniorServiceNumber));
    }

    setResult({
      category: selectCategory,
      senior: seniorServiceNumber,
      junior: juniorServiceNumber,
    });

    // scroll to results
    setTimeout(() => {
      const el = document.querySelector(".comparison-results");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const printReport = () => {
    window.print();
  };

  // Build a normalized person object for rendering
  // persData can be either: an object (persmast single object) or { items: [...] } depending on your action payload
  const normalizePers = (persData) => {
    if (!persData) return null;
    // if reducer stored single object (payload = data.items?.[0] || {}), persData is an object with sno etc
    if (persData.sno || persData.p_name) return persData;
    // if reducer stored { items: [...] } or array
    if (Array.isArray(persData)) return persData[0] || null;
    if (persData.items && persData.items.length) return persData.items[0];
    return null;
  };

  // payData and rankData are expected to be arrays OR { items: [...] } depending on how actions dispatch.
  const normalizeArray = (arrOrObj) => {
    if (!arrOrObj) return [];
    if (Array.isArray(arrOrObj)) return arrOrObj;
    if (arrOrObj.items && Array.isArray(arrOrObj.items)) return arrOrObj.items;
    return [];
  };

  // pick the right slices & per-sno entry
  const seniorPersRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerPersmastSlice,
          result?.senior || seniorServiceNumber
        )
      : getFromSlice(
          airmanPersmastSlice,
          result?.senior || seniorServiceNumber
        );

  const juniorPersRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerPersmastSlice,
          result?.junior || juniorServiceNumber
        )
      : getFromSlice(
          airmanPersmastSlice,
          result?.junior || juniorServiceNumber
        );

  const seniorPayRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerBasicPaySlice,
          result?.senior || seniorServiceNumber
        )
      : getFromSlice(
          airmanBasicPaySlice,
          result?.senior || seniorServiceNumber
        );

  const juniorPayRaw =
    selectCategory === "Officer"
      ? getFromSlice(
          officerBasicPaySlice,
          result?.junior || juniorServiceNumber
        )
      : getFromSlice(
          airmanBasicPaySlice,
          result?.junior || juniorServiceNumber
        );

  const seniorRankRaw =
    selectCategory === "Officer"
      ? getFromSlice(officerRankSlice, result?.senior || seniorServiceNumber)
      : getFromSlice(airmanRankSlice, result?.senior || seniorServiceNumber);

  const juniorRankRaw =
    selectCategory === "Officer"
      ? getFromSlice(officerRankSlice, result?.junior || juniorServiceNumber)
      : getFromSlice(airmanRankSlice, result?.junior || juniorServiceNumber);

  // normalized for rendering
  const seniorPerson = normalizePers(seniorPersRaw);
  const juniorPerson = normalizePers(juniorPersRaw);
  const seniorPayList = normalizeArray(seniorPayRaw);
  const juniorPayList = normalizeArray(juniorPayRaw);
  const seniorRankList = normalizeArray(seniorRankRaw);
  const juniorRankList = normalizeArray(juniorRankRaw);

  // console logs to help debugging
  useEffect(() => {
    console.log("selectCategory:", selectCategory);
    console.log("seniorServiceNumber:", seniorServiceNumber);
    console.log("juniorServiceNumber:", juniorServiceNumber);

    console.log("airmanPersmastSlice:", airmanPersmastSlice);
    console.log("airmanBasicPaySlice:", airmanBasicPaySlice);
    console.log("airmanRankSlice:", airmanRankSlice);

    console.log("officerPersmastSlice:", officerPersmastSlice);
    console.log("officerBasicPaySlice:", officerBasicPaySlice);
    console.log("officerRankSlice:", officerRankSlice);

    console.log("seniorPerson:", seniorPerson);
    console.log("juniorPerson:", juniorPerson);
    console.log("seniorPayList:", seniorPayList);
    console.log("juniorPayList:", juniorPayList);
    console.log("seniorRankList:", seniorRankList);
    console.log("juniorRankList:", juniorRankList);
  }, [
    selectCategory,
    seniorServiceNumber,
    juniorServiceNumber,
    airmanPersmastSlice,
    airmanBasicPaySlice,
    airmanRankSlice,
    officerPersmastSlice,
    officerBasicPaySlice,
    officerRankSlice,
    seniorPerson,
    juniorPerson,
    seniorPayList,
    juniorPayList,
    seniorRankList,
    juniorRankList,
  ]);

  // Card renderer (uses normalized objects/arrays)
  const renderCard = (
    person,
    payList,
    rankList,
    label,
    sliceLoading,
    sliceError
  ) => {
    if (
      sliceLoading &&
      !person &&
      payList.length === 0 &&
      rankList.length === 0
    ) {
      return <div className="card-comparision">{label}: Loading...</div>;
    }

    if (!person && payList.length === 0 && rankList.length === 0) {
      return <div className="card-comparision">{label}: No Data Found</div>;
    }

    return (
      <div className="">
        <div className="card-top">
          {label} • {person?.sno || "-"}
        </div>

        <div className="card-body">
          {/* PERSMAST */}
          <div className="card-title">PERSMAST</div>
          <table className="info-table">
            <tbody>
              <tr>
                <td>Cell</td>
                <td>{person?.cell ?? "-"}</td>
                <td>Unit</td>
                <td>{person?.unit_name ?? person?.unitname ?? "-"}</td>
              </tr>
              <tr>
                <td>Service No</td>
                <td>{person?.sno ?? "-"}</td>
                <td>Rank</td>
                <td>{person?.rank ?? person?.rankname ?? "-"}</td>
              </tr>
              <tr>
                <td>Trade / Branch</td>
                <td>{person?.tradename ?? person?.branch_name ?? "-"}</td>
                <td>DOE</td>
                <td>
                  {person?.enrldt
                    ? new Date(person.enrldt).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
              <tr>
                <td>Name</td>
                <td colSpan="3">{person?.p_name ?? "-"}</td>
              </tr>
              <tr>
                <td>CS</td>
                <td>{person?.cs ?? "-"}</td>
                <td>Unit Code</td>
                <td>{person?.unitcd ?? "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* BASIC PAY REASON */}
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
                    <td>
                      {p.wef
                        ? new Date(p.wef).toLocaleDateString()
                        : p.hp_date
                        ? new Date(p.hp_date).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* RANK HISTORY */}
          <div className="section-title">Rank History</div>
          {rankList.length === 0 ? (
            <p>No rank history.</p>
          ) : (
            <table className="rank-table">
              <thead>
                <tr>
                  <th>S No.</th>
                  <th>Rank</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Opt</th>
                </tr>
              </thead>
              <tbody>
                {rankList.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{r.rank ?? "-"}</td>
                    <td>
                      {r.hp_date
                        ? new Date(r.hp_date).toLocaleDateString()
                        : r.wef
                        ? new Date(r.wef).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{r.type ?? "-"}</td>
                    <td>{r.opt ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  // determine which slice-level loading/error to use (simple heuristic)
  const sliceLoading =
    selectCategory === "Officer"
      ? officerPersmastSlice?.loading ||
        officerBasicPaySlice?.loading ||
        officerRankSlice?.loading
      : airmanPersmastSlice?.loading ||
        airmanBasicPaySlice?.loading ||
        airmanRankSlice?.loading;

  const sliceError =
    selectCategory === "Officer"
      ? officerPersmastSlice?.error ||
        officerBasicPaySlice?.error ||
        officerRankSlice?.error
      : airmanPersmastSlice?.error ||
        airmanBasicPaySlice?.error ||
        airmanRankSlice?.error;

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
              type="text"
              placeholder="Enter Senior Service No"
              value={seniorServiceNumber}
              onChange={(e) => setSeniorServiceNumber(e.target.value.trim())}
            />
          </label>

          <label>
            Junior Service Number
            <input
              type="text"
              placeholder="Enter Junior Service No"
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
            {renderCard(
              seniorPerson,
              seniorPayList,
              seniorRankList,
              "Senior",
              sliceLoading,
              sliceError
            )}
            {renderCard(
              juniorPerson,
              juniorPayList,
              juniorRankList,
              "Junior",
              sliceLoading,
              sliceError
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comparison;
