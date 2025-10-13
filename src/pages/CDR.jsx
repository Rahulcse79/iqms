import React, { useState } from "react";
import "./CDR.css";

const dummyData = {
  received: [
    { name: "Alice", number: "+91 9876543210", time: "10:00 AM", duration: "2m 30s", status: "Completed" },
    { name: "Bob", number: "+91 9123456780", time: "11:30 AM", duration: "1m 15s", status: "Completed" },
    { name: "Carol", number: "+91 9988776655", time: "12:00 PM", duration: "5m 00s", status: "Completed" },
  ],
  dialed: [
    { name: "Charlie", number: "+91 9876501234", time: "09:45 AM", duration: "3m 20s", status: "Completed" },
    { name: "David", number: "+91 9123405678", time: "02:15 PM", duration: "0m 45s", status: "Completed" },
    { name: "Eva", number: "+91 9988123456", time: "03:30 PM", duration: "1m 50s", status: "Completed" },
  ],
  answered: [
    { name: "Eve", number: "+91 9988771122", time: "01:00 PM", duration: "4m 10s", status: "Completed" },
    { name: "Frank", number: "+91 9876112233", time: "03:30 PM", duration: "2m 05s", status: "Completed" },
  ],
  missed: [
    { name: "Grace", number: "+91 9123987654", time: "04:00 PM", duration: "0m 00s", status: "Missed" },
    { name: "Heidi", number: "+91 9876541122", time: "05:20 PM", duration: "0m 00s", status: "Missed" },
  ],
  all: [
    { name: "Alice", number: "+91 9876543210", time: "10:00 AM", duration: "2m 30s", type: "Received", status: "Completed" },
    { name: "Charlie", number: "+91 9876501234", time: "09:45 AM", duration: "3m 20s", type: "Dialed", status: "Completed" },
    { name: "Grace", number: "+91 9123987654", time: "04:00 PM", duration: "0m 00s", type: "Missed", status: "Missed" },
    { name: "Bob", number: "+91 9123456780", time: "11:30 AM", duration: "1m 15s", type: "Received", status: "Completed" },
  ],
};

const CDR = () => {
  const [activeTab, setActiveTab] = useState("received");

  const renderData = () => {
    const data = dummyData[activeTab] || [];
    return data.map((item, index) => (
      <tr key={index}>
        <td>{item.name}</td>
        <td>{item.number}</td>
        <td>{item.time}</td>
        <td>{item.duration}</td>
        <td className={item.type ? item.type.toLowerCase() : ""}>{item.type || "-"}</td>
        <td className={item.status.toLowerCase()}>{item.status}</td>
      </tr>
    ));
  };

  return (
    <div className="cdr-container">
      <h1>CALL  DETAILS  RECORDS</h1>
      <div className="cdr-tabs">
        {["received", "dialed", "answered", "missed", "all"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <div className="cdr-table-wrapper">
        <table className="cdr-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Number</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>{renderData()}</tbody>
        </table>
      </div>
    </div>
  );
};

export default CDR;
