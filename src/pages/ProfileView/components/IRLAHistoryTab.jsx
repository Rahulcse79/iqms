import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MonthYearPicker from "./MonthYearPicker";
import { fetchIrlaView } from "../../../actions/ProfileAction"; 

const IRLAHistoryTab = ({ selSno, selCat }) => {
  const [monthYear, setMonthYear] = useState({ month: "", year: "" });
  const dispatch = useDispatch();
  const { loading, pdfUrl, error } = useSelector((state) => state.irlaView);

  useEffect(() => {
    if (monthYear.month && monthYear.year) {
      const { month, year } = monthYear;
      const selMon = month;
      const selYr = year;
      const fullMonth = `${year}${month}`;
      dispatch(fetchIrlaView({ selSno, selCat, selYr, selMon, month: fullMonth }));
    }
  }, [monthYear, selSno, selCat, dispatch]);

  return (
    <div>
      <h2>IRLA History</h2>

      <MonthYearPicker onChange={setMonthYear} />

      {loading && <p>Loading PDF...</p>}
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
