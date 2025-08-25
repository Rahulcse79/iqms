import React, { useMemo, useState } from "react";
import "./ConsolidatedQueries.css";

const sampleSummary = [
    { key: "AFG", name: "AFG", received: 1391, replied: 1353, pending: 38 },
    { key: "CCS-AFGS", name: "CCS-AFGS", received: 66, replied: 66, pending: 0 },
    { key: "CCS-GOVADV", name: "CCS-GOVADV", received: 40, replied: 38, pending: 2 },
    { key: "CCS-JAFBA", name: "CCS-JAFBA", received: 59, replied: 59, pending: 0 },
    { key: "CCS-IT", name: "CCS-IT", received: 346, replied: 345, pending: 1 },
    { key: "CCS-PLI", name: "CCS-PLI", received: 536, replied: 532, pending: 4 },
    { key: "CQC", name: "CQC", received: 17226, replied: 17082, pending: 124 },
    { key: "SR-JR", name: "SR JR", received: 1814, replied: 1804, pending: 10 },
    { key: "APG", name: "APG", received: 305, replied: 300, pending: 5 },
];

const subSectionData = {
    AFG: [
        { typeName: "Provident Fund", received: 800, replied: 790, pending: 10 },
        { typeName: "Provident Fund / Nomination", received: 591, replied: 563, pending: 28 },
    ],
    "CCS-GOVADV": [
        { typeName: "Govt Loans/Advances", received: 40, replied: 38, pending: 2 },
    ],
    "CCS-IT": [{ typeName: "Income Tax", received: 346, replied: 345, pending: 1 }],
    "CCS-PLI": [{ typeName: "PLI Related", received: 536, replied: 532, pending: 4 }],
    CQC: Array.from({ length: 8 }).map((_, i) => ({
        typeName: `CQC - ${i + 1}`,
        received: 200 + i * 2,
        replied: 195 + i * 2,
        pending: 5,
    })),
    "SR-JR": [{ typeName: "SR JR", received: 1814, replied: 1804, pending: 10 }],
    APG: Array.from({ length: 8 }).map((_, i) => ({
        typeName: `APS - ${i + 1}`,
        received: 10 + i,
        replied: 9 + i,
        pending: 1,
    })),
};

const samplePendingList = [
    {
        queryId: "106664381",
        persDetails: "968237-A CPL UPENDRA KUMAR (PRO) FIT",
        cell: "601",
        receivedDate: "2025-08-01",
        queryType: "Provident Fund / Nomination",
        pendingWith: "WO/C Cell - APW",
    },
    {
        queryId: "106963175",
        persDetails: "919516-H SGT SHINDE AMIT RAMESH (ADM ASST)(GD)",
        cell: "306",
        receivedDate: "2025-08-02",
        queryType: "Provident Fund / Nomination",
        pendingWith: "WO/C Cell - APW",
    },
    {
        queryId: "106772033",
        persDetails: "986630-H CPL POTHUREDDY GANDAIAH SATISH AUTO TECH",
        cell: "611",
        receivedDate: "2025-08-04",
        queryType: "POR/Office Order Related Queries",
        pendingWith: "AFG Approver",
    },
    {
        queryId: "106723320",
        persDetails: "743005-A NO AGARWAL LAL YADAV RAF/ FIT",
        cell: "611",
        receivedDate: "2025-08-04",
        queryType: "Sr Jr",
        pendingWith: "SR JR Clerk",
    },
    {
        queryId: "106768370",
        persDetails: "732737-K WMO BIDYARTHI PANKAJ (ADM) FIT",
        cell: "814",
        receivedDate: "2025-08-04",
        queryType: "Pay & Advances",
        pendingWith: "CCS-GOVADV Approver",
    },
    { queryId: "106900111", persDetails: "900111-A LOKESH KUMAR (ACCTS) FIT", cell: "305", receivedDate: "2025-07-15", queryType: "Income Tax", pendingWith: "CCS-IT" },
    { queryId: "106900222", persDetails: "900222-S RAJESH KUMAR (CQC) FIT", cell: "308", receivedDate: "2025-06-20", queryType: "CQC Query", pendingWith: "CQC" },
];

function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString();
}
function formatNumber(n) {
    return n?.toLocaleString?.() ?? n;
}

const ConsolidatedQueries = () => {

    const [expanded, setExpanded] = useState({});
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [showAllPending, setShowAllPending] = useState(false);

    const handleSearch = () => {
        console.log("Searching from:", fromDate, "to:", toDate);
    };

    const totals = useMemo(() => {
        const totalReceived = sampleSummary.reduce((s, it) => s + (it.received || 0), 0);
        const totalReplied = sampleSummary.reduce((s, it) => s + (it.replied || 0), 0);
        const totalPending = sampleSummary.reduce((s, it) => s + (it.pending || 0), 0);
        return { totalReceived, totalReplied, totalPending };
    }, []);

    const filteredPending = useMemo(() => {
        const list = samplePendingList.slice();
        return list.filter((item) => {
            if (fromDate) {
                const fd = new Date(fromDate);
                if (new Date(item.receivedDate) < fd) return false;
            }
            if (toDate) {
                const td = new Date(toDate);
                if (new Date(item.receivedDate) > td) return false;
            }

            return true;
        }).sort((a, b) => new Date(a.receivedDate) - new Date(b.receivedDate));
    }, [fromDate, toDate]);

    const oldestFive = filteredPending.slice(0, 5);

    const toggleExpand = (key) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="consolidated-page">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "15px",
                }}
            >
                <label style={{ display: "flex", flexDirection: "column", fontSize: "14px" }}>
                    From
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{ padding: "5px", fontSize: "14px" }}
                    />
                </label>

                <label style={{ display: "flex", flexDirection: "column", fontSize: "14px" }}>
                    To
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        style={{ padding: "5px", fontSize: "14px" }}
                    />
                </label>

                <button
                    onClick={handleSearch}
                    style={{
                        marginTop: "20px",
                        padding: "6px 12px",
                        fontSize: "14px",
                        cursor: "pointer",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        backgroundColor: "#007bff",
                        color: "white",
                    }}
                >
                    Search
                </button>
            </div>

            <div className="summary-table-wrap">
                <table className="summary-table" role="grid" aria-label="Summary table">
                    <thead>
                        <tr>
                            <th>View</th>
                            <th>Sub Section</th>
                            <th className="num">Total Received</th>
                            <th className="num">Replied</th>
                            <th className="num">Pending</th>
                        </tr>
                    </thead>

                    <tbody>
                        {sampleSummary.map((row) => (
                            <React.Fragment key={row.key}>
                                <tr className="main-row">
                                    <td className="view-col">
                                        <button
                                            className="expand-btn"
                                            onClick={() => toggleExpand(row.key)}
                                            aria-expanded={!!expanded[row.key]}
                                            aria-controls={`sub-${row.key}`}
                                        >
                                            {expanded[row.key] ? "−" : "+"}
                                        </button>
                                    </td>

                                    <td>{row.name}</td>
                                    <td className="num">{formatNumber(row.received)}</td>
                                    <td className="num">{formatNumber(row.replied)}</td>
                                    <td className="num pending">{formatNumber(row.pending)}</td>
                                </tr>

                                {expanded[row.key] && (
                                    <tr className="sub-row">
                                        <td colSpan="5" id={`sub-${row.key}`}>
                                            <div className="sub-table-wrap">
                                                <table className="sub-table" role="table" aria-label={`${row.name} detail`}>
                                                    <thead>
                                                        <tr>
                                                            <th>Query Type</th>
                                                            <th className="num">Total Received</th>
                                                            <th className="num">Replied</th>
                                                            <th className="num">Pending</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(subSectionData[row.key] || []).map((s, idx) => (
                                                            <tr key={idx}>
                                                                <td>{s.typeName}</td>
                                                                <td className="num">{formatNumber(s.received)}</td>
                                                                <td className="num">{formatNumber(s.replied)}</td>
                                                                <td className="num pending">{formatNumber(s.pending)}</td>
                                                            </tr>
                                                        ))}

                                                        {(!subSectionData[row.key] || subSectionData[row.key].length === 0) && (
                                                            <tr>
                                                                <td colSpan="4" className="no-data">No sub-section data available</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}

                        <tr className="total-row">
                            <td></td>
                            <td className="total-label">TOTAL COUNT</td>
                            <td className="num">{formatNumber(totals.totalReceived || sampleSummary.reduce((s, i) => s + i.received, 0))}</td>
                            <td className="num">{formatNumber(totals.totalReplied || sampleSummary.reduce((s, i) => s + i.replied, 0))}</td>
                            <td className="num pending">{formatNumber(totals.totalPending || sampleSummary.reduce((s, i) => s + i.pending, 0))}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="oldest-card">
                <div className="oldest-header">
                    <div>Oldest five query pending with : <strong>APW</strong></div>
                    <div>
                        <button className="view-all-btn" onClick={() => setShowAllPending((s) => !s)}>
                            {showAllPending ? "Show Top 5" : "View All"}
                        </button>
                    </div>
                </div>

                <div className="oldest-table-wrap">
                    <table className="oldest-table">
                        <thead>
                            <tr>
                                <th>Sl. No.</th>
                                <th>Query ID</th>
                                <th>Pers Details</th>
                                <th>Cell</th>
                                <th>Query Received Date</th>
                                <th>Query Type</th>
                                <th>Pending With</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(showAllPending ? filteredPending : oldestFive).map((r, idx) => (
                                <tr key={r.queryId}>
                                    <td>{idx + 1}</td>
                                    <td>{r.queryId}</td>
                                    <td className="pers">{r.persDetails}</td>
                                    <td>{r.cell}</td>
                                    <td>{formatDate(r.receivedDate)}</td>
                                    <td>{r.queryType}</td>
                                    <td>{r.pendingWith}</td>
                                </tr>
                            ))}
                            {(!showAllPending && oldestFive.length === 0) && (
                                <tr>
                                    <td colSpan="7" className="no-data">No pending queries found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedQueries;
