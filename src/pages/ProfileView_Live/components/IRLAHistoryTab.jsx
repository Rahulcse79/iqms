import React, { useState, useEffect } from "react";
import MonthYearPicker from "./MonthYearPicker";
import { useLocation } from "react-router-dom";
import { UserRole } from "../../../constants/Enum";
import axios from "axios";

const IRLA_API_TOKEN = "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS"; 

const IRLAHistoryTab = () => {
  const [monthYear, setMonthYear] = useState({ month: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selSno = queryParams.get("q");
  const catStr = queryParams.get("category");
  const selCat = UserRole[catStr] !== undefined ? UserRole[catStr] : null;

  useEffect(() => {
    const fetchIrlaView = async () => {
      if (!selSno || selCat === null || !monthYear.month || !monthYear.year) return;

      setLoading(true); 
      setError(null);
      setPdfUrl(null);

      try {
        const { month, year } = monthYear;
        const selMon = month;
        const selYr = year;
        const fullMonth = `${year}${month}`;

        const body = new URLSearchParams({ api_token: IRLA_API_TOKEN });

        const response = await axios.post(
          `http://175.25.5.7/API/controller.php?apexApiPaySlip&selSno=${selSno}&selCat=${selCat}&selYr=${selYr}&selMon=${selMon}&month=${fullMonth}&section=FULL&request=PANKH`,
          body,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            responseType: "blob",
            timeout: 20000,
          }
        );

        const pdfBlob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to fetch IRLA View");
      } finally {
        setLoading(false);
      }
    };

    fetchIrlaView();
  }, [monthYear, selSno, selCat]);

  return (
    <div>
      <h2 style={{ color: "var(--text)" }}>IRLA History</h2>

      <MonthYearPicker onChange={setMonthYear} />

      {loading && <p style={{ color: "var(--text)", padding: "10px" }}>Loading PDF...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {pdfUrl && (
        <iframe src={pdfUrl} width="100%" height="600px" title="IRLA Payslip PDF" />
      )}
    </div>
  );
};

export default IRLAHistoryTab;
