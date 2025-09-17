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

  return (
    <div>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      >
        <option value="">Select Month</option>
        {months.map((m, idx) => (
          <option
            key={idx}
            value={idx + 1 < 10 ? `0${idx + 1}` : idx + 1} // format as 01,02...
            disabled={idx === currentMonth} // disable current month
          >
            {m}
          </option>
        ))}
      </select>

      <select
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
