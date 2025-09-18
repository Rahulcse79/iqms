import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MonthYearPicker from "./MonthYearPicker";
import { useLocation } from "react-router-dom";
import { UserRole } from "../../../constants/Enum"; 
import { fetchIrlaView } from "../../../actions/ProfileAction"; 

const IRLAHistoryTab = () => {
  const [monthYear, setMonthYear] = useState({ month: "", year: "" });
  const dispatch = useDispatch();
  const { loading, pdfUrl, error } = useSelector((state) => state.irlaView);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selSno = queryParams.get("q");
  const catStr = queryParams.get("category");
  const selCat = UserRole[catStr] !== undefined ? UserRole[catStr] : null;

  useEffect(() => {
    if (monthYear.month && monthYear.year) {
      if (selSno && selCat !== null) {
      const { month, year } = monthYear;
      const selMon = month;
      const selYr = year;
      const fullMonth = `${year}${month}`;
      dispatch(fetchIrlaView({ selSno, selCat, selYr, selMon, month: fullMonth }));
      }
    }
  }, [monthYear, selSno, selCat, dispatch]);

  return (
    <div>
      <h2 style={{ color: "var(--text)" }}>IRLA History</h2>

      <MonthYearPicker onChange={setMonthYear} />

      {loading && <p style={{color:"var(--text)", padding:"10px" }}>Loading PDF...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {pdfUrl && (
        <iframe
          src={pdfUrl}
          width="100%"
          height="600px"
          title="IRLA Payslip PDF"
        />
      )}
    </div>
  );
};

export default IRLAHistoryTab;
