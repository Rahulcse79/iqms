import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./View_Income_Queries.css";
import jsPDF from "jspdf";

function View_Income_Queries() {
    const [search, setSearch] = useState("");

    const data = [
        {
            id: 1,
            serviceNo: "12345",
            type: "Individual (CQC)",
            queryId: "Q001",
            date: "2025-08-20",
        },
        {
            id: 2,
            serviceNo: "67890",
            type: "Transferred",
            queryId: "Q002",
            date: "2025-08-21",
        },
    ];

    const columns = [
        {
            name: "S.No",
            selector: (row, index) => index + 1,
            width: "80px",
        },
        {
            name: "Service No (Pers)",
            selector: (row) => row.serviceNo,
            sortable: true,
        },
        {
            name: "Query Type",
            selector: (row) => row.type,
            sortable: true,
        },
        {
            name: "Query ID",
            selector: (row) => row.queryId,
            sortable: true,
        },
        {
            name: "Query Received (AFCAAD Date)",
            selector: (row) => row.date,
            sortable: true,
        },
        {
            name: "Action",
            cell: () => <button className="action-btn">View</button>,
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
    ];

    const filteredData = data.filter(
        (item) =>
            item.serviceNo.toLowerCase().includes(search.toLowerCase()) ||
            item.queryId.toLowerCase().includes(search.toLowerCase()) ||
            item.type.toLowerCase().includes(search.toLowerCase())
    );

    const CopyAction = () => {
        const text = filteredData
            .map(
                (row, i) =>
                    `${i + 1}\t${row.serviceNo}\t${row.type}\t${row.queryId}\t${row.date}`
            )
            .join("\n");
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const CSVAction = () => {
        const header = ["S.No", "Service No", "Query Type", "Query ID", "Date"];
        const rows = filteredData.map((row, i) => [
            i + 1,
            row.serviceNo,
            row.type,
            row.queryId,
            row.date,
        ]);
        let csv = [header, ...rows].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "queries.csv";
        link.click();
        window.open(url);
    };

    const PDFAction = () => {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.text("Report Data", 20, 20);
        doc.setFont("helvetica", "normal");
        doc.text("This is sample exported data.", 20, 40);
        doc.text("Generated at: " + new Date().toLocaleString(), 20, 60);
        doc.save("report.pdf");
        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl);
    };

    const PrintAction = () => {
        const content = filteredData
            .map(
                (row, i) =>
                    `${i + 1} | ${row.serviceNo} | ${row.type} | ${row.queryId} | ${row.date}`
            )
            .join("\n");
        const printWindow = window.open("", "", "width=800,height=600");
        printWindow.document.write("<pre>" + content + "</pre>");
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="view-income-queries">
            <h2>View Incoming Queries</h2>

            <Tabs>
                <TabList className="tab-container">
                    <Tab className="tab">Query From Individual (CQC)</Tab>
                    <Tab className="tab">Query Transferred</Tab>
                    <Tab className="tab">Queries Replied</Tab>
                </TabList>

                <div className="export-buttons">
                    <button onClick={CopyAction}>Copy</button>
                    <button onClick={CSVAction}>CSV</button>
                    <button onClick={PrintAction}>Print</button>
                    <button onClick={PDFAction}>PDF</button>
                </div>

                <TabPanel>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-bar"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        highlightOnHover
                        striped
                        responsive
                    />
                </TabPanel>

                <TabPanel>
                <input
                        type="text"
                        placeholder="Search..."
                        className="search-bar"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        highlightOnHover
                        striped
                        responsive
                    />
                </TabPanel>

                <TabPanel>
                <input
                        type="text"
                        placeholder="Search..."
                        className="search-bar"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        highlightOnHover
                        striped
                        responsive
                    />
                </TabPanel>
            </Tabs>
        </div>
    );
}

export default View_Income_Queries;
