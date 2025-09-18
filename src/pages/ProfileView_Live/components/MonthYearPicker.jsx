import React, { useState, useEffect } from "react";

const MonthYearPicker = ({ onChange }) => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const years = [];
  for (let y = currentYear - 5; y <= currentYear; y++) {
    years.push(y);
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Notify parent of selection
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      onChange({ month: selectedMonth, year: selectedYear });
    }
  }, [selectedMonth, selectedYear, onChange]);

  // common styles
  const selectStyle = {
    padding: "8px 12px",
    marginRight: "10px",
    borderRadius: "6px",
    border: "1px solid var(--border, #d1d5db)",
    background: "var(--surface, #fff)",
    color: "var(--text, #111827)",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  };

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
  };

  return (
    <div style={containerStyle}>
      <select
        style={selectStyle}
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      >
        <option value="">Select Month</option>
        {months.map((m, idx) => (
          <option
            key={idx}
            value={idx + 1 < 10 ? `0${idx + 1}` : idx + 1} // format as 01,02...
            disabled={idx === currentMonth}
          >
            {m}
          </option>
        ))}
      </select>

      <select
        style={selectStyle}
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        <option value="">Select Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MonthYearPicker;