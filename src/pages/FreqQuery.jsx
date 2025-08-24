import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";   // ✅ correct import
import "./FreqQuery.css";

function FreqQuery() {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [searchText, setSearchText] = useState("");
    const [filteredData, setFilteredData] = useState([]);

    const data = [
        { id: 1, details: "Rahul Singh", queries: 12, date: "2025-08-01" },
        { id: 2, details: "Amit Sharma", queries: 8, date: "2025-08-02" },
        { id: 3, details: "Sneha Verma", queries: 15, date: "2025-08-02" },
        { id: 4, details: "Arjun Kumar", queries: 20, date: "2025-08-03" },
        { id: 5, details: "Priya Mehta", queries: 11, date: "2025-08-04" },
        { id: 6, details: "Karan Patel", queries: 9, date: "2025-08-05" },
        { id: 7, details: "Neha Gupta", queries: 17, date: "2025-08-05" },
        { id: 8, details: "Vikram Rao", queries: 14, date: "2025-08-06" },
        { id: 9, details: "Simran Kaur", queries: 13, date: "2025-08-07" },
        { id: 10, details: "Rohan Das", queries: 10, date: "2025-08-07" },
        { id: 11, details: "Ayesha Khan", queries: 16, date: "2025-08-08" },
        { id: 12, details: "Sanjay Yadav", queries: 7, date: "2025-08-08" },
        { id: 13, details: "Pooja Sharma", queries: 19, date: "2025-08-09" },
        { id: 14, details: "Deepak Malhotra", queries: 22, date: "2025-08-10" },
        { id: 15, details: "Nikhil Jain", queries: 18, date: "2025-08-10" },
        { id: 16, details: "Ananya Roy", queries: 6, date: "2025-08-11" },
        { id: 17, details: "Rajesh Singh", queries: 25, date: "2025-08-11" },
        { id: 18, details: "Sonia Kapoor", queries: 14, date: "2025-08-12" },
        { id: 19, details: "Manoj Kumar", queries: 20, date: "2025-08-12" },
        { id: 20, details: "Alok Pandey", queries: 9, date: "2025-08-13" },
    ];

    // initially show all data
    useEffect(() => {
        setFilteredData(data);
    }, []);

    // filter by date
    const handleSearch = () => {
        let result = data.filter((row) => {
            if (fromDate && row.date < fromDate) return false;
            if (toDate && row.date > toDate) return false;
            return true;
        });
        setFilteredData(result);
    };

    // 🔹 Inner search (filter by S.No or Person Details)
    const searchedData = filteredData.filter((row) => {
        if (!searchText) return true;
        return (
            row.id.toString().includes(searchText.toLowerCase()) ||
            row.details.toLowerCase().includes(searchText.toLowerCase())
        );
    });

    const columns = [
        { name: "S.No", selector: (row) => row.id, sortable: true, width: "80px" },
        { name: "Person Details", selector: (row) => row.details, sortable: true },
        { name: "No. of Queries", selector: (row) => row.queries, sortable: true },
        { name: "Date", selector: (row) => row.date, sortable: true },
    ];

    // Print as PDF
    const handlePrint = () => {
        const doc = new jsPDF();
        doc.text("Frequency Queries Report", 14, 10);

        autoTable(doc, {
            head: [["S.No", "Person Details", "No. of Queries", "Date"]],
            body: searchedData.map((row) => [
                row.id,
                row.details,
                row.queries,
                row.date,
            ]),
        });

        doc.save("FreqQueries.pdf");
    };

    // Copy to clipboard
    const handleCopy = () => {
        const text = searchedData
            .map((row) => `${row.id}\t${row.details}\t${row.queries}\t${row.date}`)
            .join("\n");
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    // CSV headers
    const csvHeaders = [
        { label: "S.No", key: "id" },
        { label: "Person Details", key: "details" },
        { label: "No. of Queries", key: "queries" },
        { label: "Date", key: "date" },
    ];

    return (
        <div className="freq-page">
            <div className="filter-row">
                <label>
                    From
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </label>
                <label>
                    To
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </label>
                <button onClick={handleSearch} className="search-btn">
                    Search
                </button>
            </div>

            {/* Export Buttons */}
            <div className="export-row">
                <button onClick={handleCopy}>Copy</button>
                <CSVLink
                    data={searchedData}
                    headers={csvHeaders}
                    filename={"FreqQueries.csv"}
                >
                    <button>CSV</button>
                </CSVLink>
                <button onClick={handlePrint}>Print</button>
            </div>

            {/* 🔹 Inner Table Search */}
            <div className="filter-row">
                <label>
                    Search
                    <input
                        type="text"
                        placeholder="By S.No or Person Details"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </label>
            </div>

            {/* Data Table */}
            <div className="table-wrap">
                <DataTable
                    columns={columns}
                    data={searchedData}
                    pagination
                    highlightOnHover
                    striped
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20]}
                    customStyles={{
                        pagination: {
                            style: {
                                color: "black",
                                fontWeight: "bold",
                                fontSize: "14px",
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
}

export default FreqQuery;
