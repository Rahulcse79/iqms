import React, { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

/**
 * MonthYearPicker
 * - Choose year first (2013 → current year)
 * - Month selector is enabled only after year is chosen
 * - Future months (for the current year) are disabled
 * - Calls onChange({ month: '01', year: '2025' }) when both selected
 */

const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export default function MonthYearPicker({
  onChange,
  minYear = 2013,
  maxYear = new Date().getFullYear(),
  defaultYear = "",
  defaultMonth = "",
}) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth(); // 0..11

  // ✅ Generate years from minYear → maxYear
  const years = useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const [year, setYear] = useState(defaultYear || "");
  const [month, setMonth] = useState(defaultMonth || "");

  useEffect(() => {
    if (year && month) {
      onChange({ month, year: String(year) });
    } else {
      onChange({ month: "", year: "" });
    }
  }, [year, month, onChange]);

  const onYearChange = useCallback((e) => {
    const v = e.target.value;
    setYear(v);
    setMonth("");
  }, []);

  const onMonthChange = useCallback((e) => {
    setMonth(e.target.value);
  }, []);

  const monthOptions = useMemo(() => {
    return MONTHS.map((m, idx) => {
      const monthNum = idx + 1; // 1..12
      let disabled = false;
      // Disable future months if current year selected
      if (
        String(year) === String(currentYear) &&
        monthNum > currentMonthIndex + 1
      ) {
        disabled = true;
      }
      return { ...m, disabled };
    });
  }, [year, currentYear, currentMonthIndex]);

  return (
    <div className="irla-picker">
      <label className="irla-picker__label" htmlFor="irla-year-select">
        Year
      </label>
      <select
        id="irla-year-select"
        className="irla-picker__select"
        value={year}
        onChange={onYearChange}
        aria-label="Select Year"
      >
        <option value="">Select Year</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <label className="irla-picker__label" htmlFor="irla-month-select">
        Month
      </label>
      <select
        id="irla-month-select"
        className="irla-picker__select"
        value={month}
        onChange={onMonthChange}
        aria-label="Select Month"
        disabled={!year}
      >
        <option value="">{year ? "Select Month" : "Select Year first"}</option>
        {monthOptions.map((m) => (
          <option key={m.value} value={m.value} disabled={m.disabled}>
            {m.label}
            {m.disabled ? " (unavailable)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

MonthYearPicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  minYear: PropTypes.number,
  maxYear: PropTypes.number,
  defaultYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultMonth: PropTypes.string,
};
