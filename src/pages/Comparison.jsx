import React, { useState } from "react";
import "./Comparison.css";

const makeDummyPerson = (serviceNo, isSenior = true) => {
  // Create deterministic dummy data based on service number
  const suffix = isSenior ? "-A" : "-S";
  const idx = serviceNo ? serviceNo.slice(-3) : "001";
  return {
    serviceNo: serviceNo ? `${serviceNo}${suffix}` : `000${suffix}`,
    cellNo: 300 + Number(idx.slice(-2)),
    unit: isSenior ? "2 SED - RE24" : "HQ AF C - AU28",
    rank: "CPL",
    name: isSenior ? "WANMAHADE RONIT GANESH" : "SANDEEP KUMAR",
    trade: "ACCTS ASST",
    doe: "31-DEC-14",
    persmastTitle: "PERSMAST",
    rankHistory: [
      { sno: 1, rank: "AC", rankDate: "31-DEC-14" },
      { sno: 2, rank: "LAC", rankDate: "01-JAN-18" },
    ],
  };
};

const Comparison = () => {
  const [seniorServiceNumber, setSeniorServiceNumber] = useState("");
  const [juniorServiceNumber, setJuniorServiceNumber] = useState("");
  const [selectCategory, setSelectCategory] = useState("Airmen");
  const [result, setResult] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();

    if (!seniorServiceNumber || !juniorServiceNumber || !selectCategory) {
      alert("Please fill in all fields before searching.");
      return;
    }

    // Create dummy data for both senior and junior
    const senior = makeDummyPerson(seniorServiceNumber, true);
    const junior = makeDummyPerson(juniorServiceNumber, false);

    setResult({ category: selectCategory, senior, junior });
    // scroll to results
    setTimeout(() => {
      const el = document.querySelector(".comparison-results");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const printReport = () => {
    if (!result) return;
    const html = `
      <html>
        <head>
          <title>Comparative Statement</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #222;}
            .two { display: flex; gap: 20px;}
            .card { flex:1; border: 1px solid #ddd; border-radius:6px; padding:12px; }
            .card h3 { margin:0 0 6px 0; font-size:14px; background:#f1f1f1; padding:8px; border-radius:4px;}
            table { width:100%; border-collapse: collapse; margin-top:8px;}
            td, th { padding:8px; border: 1px solid #eee; font-size:13px;}
            .section-title { margin-top:12px; font-weight:700; font-size:13px;}
          </style>
        </head>
        <body>
          <h2>Comparative Statement (${result.category})</h2>
          <div class="two">
            ${renderCardHtml(result.senior, "Senior")}
            ${renderCardHtml(result.junior, "Junior")}
          </div>
        </body>
      </html>
    `;
    const w = window.open("", "_blank");
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  // helper to build small HTML for printing
  const renderCardHtml = (person, label) => {
    return `
      <div class="card">
        <h3>${label} • ${person.serviceNo}</h3>
        <div><strong>${person.persmastTitle}</strong></div>
        <table>
          <tbody>
            <tr><td>Cell No</td><td>${person.cellNo}</td></tr>
            <tr><td>Unit</td><td>${person.unit}</td></tr>
            <tr><td>Service No</td><td>${person.serviceNo}</td></tr>
            <tr><td>Rank</td><td>${person.rank}</td></tr>
            <tr><td>Name</td><td>${person.name}</td></tr>
            <tr><td>Trade</td><td>${person.trade}</td></tr>
            <tr><td>DOE</td><td>${person.doe}</td></tr>
          </tbody>
        </table>
        <div class="section-title">RANK HISTORY</div>
        <table>
          <thead><tr><th>S.No</th><th>Rank</th><th>Rank Date</th></tr></thead>
          <tbody>
            ${person.rankHistory
              .map(
                (r) =>
                  `<tr><td>${r.sno}</td><td>${r.rank}</td><td>${r.rankDate}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

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
            <h3>Pay Comparative Statement</h3>
            <button className="print-btn" onClick={printReport}>
              Print Report
            </button>
          </div>

          <div className="cards">
            <div className="card">
              <div className="card-top">Senior • {result.senior.serviceNo}</div>
              <div className="card-body">
                <div className="card-title">{result.senior.persmastTitle}</div>
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td>Cell No</td>
                      <td>{result.senior.cellNo}</td>
                      <td>Unit</td>
                      <td>{result.senior.unit}</td>
                    </tr>
                    <tr>
                      <td>Service No</td>
                      <td>{result.senior.serviceNo}</td>
                      <td>Rank</td>
                      <td>{result.senior.rank}</td>
                    </tr>
                    <tr>
                      <td>Trade</td>
                      <td>{result.senior.trade}</td>
                      <td>DOE</td>
                      <td>{result.senior.doe}</td>
                    </tr>
                    <tr>
                      <td>Name</td>
                      <td colSpan="3">{result.senior.name}</td>
                    </tr>
                  </tbody>
                </table>

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
                    {result.senior.rankHistory.map((r) => (
                      <tr key={r.sno}>
                        <td>{r.sno}</td>
                        <td>{r.rank}</td>
                        <td>{r.rankDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-top">Junior • {result.junior.serviceNo}</div>
              <div className="card-body">
                <div className="card-title">{result.junior.persmastTitle}</div>
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td>Cell No</td>
                      <td>{result.junior.cellNo}</td>
                      <td>Unit</td>
                      <td>{result.junior.unit}</td>
                    </tr>
                    <tr>
                      <td>Service No</td>
                      <td>{result.junior.serviceNo}</td>
                      <td>Rank</td>
                      <td>{result.junior.rank}</td>
                    </tr>
                    <tr>
                      <td>Trade</td>
                      <td>{result.junior.trade}</td>
                      <td>DOE</td>
                      <td>{result.junior.doe}</td>
                    </tr>
                    <tr>
                      <td>Name</td>
                      <td colSpan="3">{result.junior.name}</td>
                    </tr>
                  </tbody>
                </table>

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
                    {result.junior.rankHistory.map((r) => (
                      <tr key={r.sno}>
                        <td>{r.sno}</td>
                        <td>{r.rank}</td>
                        <td>{r.rankDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comparison;
