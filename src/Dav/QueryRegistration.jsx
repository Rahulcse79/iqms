import React, { useState } from "react";
import "./QueryRegistration.css";

const QueryRegistration = () => {
  const [serviceNo, setServiceNo] = useState("");

  const [formData, setFormData] = useState({
    queryNo: "",
    rank: "",
    firstName: "",
    lastName: "",
    middleName: "",
    address1: "",
    address2: "",
    state: "",
    region: "",
    isdCode: "91",
    mobile: "",
    category: "",
    subCategory: "",
    oldRefNo: "",
    oldRefDate: "",
    docReqNo: "",
    docIssueNo: "",
    queryDate: "",
    queryPriority: "",
    status: "Initiated",
    queryStatus: "Open",
    pincode: "",
    country: "India",
    email: "",
    forwardedSection: "",
    queryMessage: "",
    replyMessage: "",
  });

  const [previousQueries, setPreviousQueries] = useState([]);

  // handle generic field update
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShow = () => {
    if (!serviceNo) return alert("Enter Service No first");

    // dummy API response
    const apiResponse = {
      queryNo: "1234",
      rank: "Captain",
      firstName: "Rahul",
      lastName: "Singh",
      middleName: "Kumar",
      address1: "Sector 10",
      address2: "New Delhi",
      state: "Delhi",
      region: "North",
      category: "General",
      subCategory: "Pension",
      mobile: "9876543210",
      email: "rahul@example.com",
      pincode: "110001",
      forwardedSection: "Admin",
      queryDate: "2025-08-28",
      queryPriority: "High",
      oldRefNo: "OR-567",
      oldRefDate: "2025-05-15",
      docReqNo: "DR-1122",
      docIssueNo: "DI-7788",
      queryMessage: "Requesting pension related documents.",
      replyMessage: "Your request is being processed.",
    };

    setFormData((prev) => ({ ...prev, ...apiResponse }));

    // dummy previous queries
    setPreviousQueries([
      {
        queryNo: "Q001",
        queryDate: "2025-07-10",
        category: "General",
        queryMessage: "Asked about pension process.",
        replyMessage: "Replied with guidelines.",
        status: "Closed",
      },
      {
        queryNo: "Q002",
        queryDate: "2025-07-22",
        category: "Documents",
        queryMessage: "Requested ID verification.",
        replyMessage: "Document issued.",
        status: "Closed",
      },
      {
        queryNo: "Q003",
        queryDate: "2025-08-01",
        category: "Pension",
        queryMessage: "Asked about new rules.",
        replyMessage: "Clarification sent.",
        status: "Closed",
      },
      {
        queryNo: "Q004",
        queryDate: "2025-08-15",
        category: "Service",
        queryMessage: "Requested service record.",
        replyMessage: "Under review.",
        status: "In Progress",
      },
      {
        queryNo: "Q005",
        queryDate: "2025-08-20",
        category: "General",
        queryMessage: "Asked about holiday benefits.",
        replyMessage: "Pending.",
        status: "Open",
      },
    ]);
  };

  return (
    <div className="container">
      <h2>Query Registration</h2>
      <div className="form-3col">
        {/* Left column */}
        <div className="col">
          <label>Service No</label>
          <div className="row-input">
            <input
              type="text"
              value={serviceNo}
              onChange={(e) => setServiceNo(e.target.value)}
            />
            <button className="buttonShow" type="button" onClick={handleShow}>
              Show
            </button>
          </div>

          <label>Query No</label>
          <input type="text" name="queryNo" value={formData.queryNo} readOnly />

          <label>Rank</label>
          <input type="text" name="rank" value={formData.rank} readOnly />

          <label>First Name</label>
          <input type="text" name="firstName" value={formData.firstName} readOnly />

          <label>Address 1</label>
          <input type="text" name="address1" value={formData.address1} readOnly />

          <label>State</label>
          <input type="text" name="state" value={formData.state} readOnly />

          <label>ISD Code</label>
          <input type="text" name="isdCode" value={formData.isdCode} readOnly />

          <label>Category</label>
          <input type="text" name="category" value={formData.category} readOnly />

          <label>Old Reference No</label>
          <input type="text" name="oldRefNo" value={formData.oldRefNo} readOnly />

          <label>Document Request No</label>
          <input type="text" name="docReqNo" value={formData.docReqNo} readOnly />
        </div>

        {/* Middle column */}
        <div className="col">
          <label>Mode of Query</label>
          <input type="text" name="modeOfQuery" onChange={handleChange} />

          <label>Query Date</label>
          <input type="date" name="queryDate" value={formData.queryDate} onChange={handleChange} />

          <label>Query Priority</label>
          <input type="text" name="queryPriority" value={formData.queryPriority} onChange={handleChange} />

          <label>Middle Name</label>
          <input type="text" name="middleName" value={formData.middleName} readOnly />

          <label>Address 2</label>
          <input type="text" name="address2" value={formData.address2} readOnly />

          <label>Region</label>
          <input type="text" name="region" value={formData.region} readOnly />

          <label>Mobile No</label>
          <input type="text" name="mobile" value={formData.mobile} readOnly />

          <label>Sub Category</label>
          <input type="text" name="subCategory" value={formData.subCategory} readOnly />

          <label>Old Reference Date</label>
          <input type="date" name="oldRefDate" value={formData.oldRefDate} onChange={handleChange} />

          <label>Document Issue No</label>
          <input type="text" name="docIssueNo" value={formData.docIssueNo} readOnly />
        </div>

        {/* Right column */}
        <div className="col">
          <div className="status-box">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Initiated">Initiated</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
            <div>
              <button className="btn btn-secondary" type="button">View Comment</button>
              <button className="btn btn-primary" type="button">Add Comment</button>
            </div>
          </div>

          <label>Last Name</label>
          <input type="text" name="lastName" value={formData.lastName} readOnly />

          <label>Pincode</label>
          <input type="text" name="pincode" value={formData.pincode} readOnly />

          <label>Country</label>
          <select name="country" value={formData.country} onChange={handleChange}>
            <option>India</option>
            <option>Other</option>
          </select>

          <label>Email ID</label>
          <input type="email" name="email" value={formData.email} readOnly />

          <label>Forwarded Section</label>
          <input type="text" name="forwardedSection" value={formData.forwardedSection} readOnly />

          <label>Query Status</label>
          <input type="text" name="queryStatus" value={formData.queryStatus} readOnly />

          <button className="btn btn-primary" style={{ marginTop: "10px" }} type="button">
            Gen Document Req
          </button>
        </div>
      </div>

      {/* Query message box */}
      <div className="query-box">
        <h3>Query Registration</h3>
        <label>Query Message</label>
        <div className="row-input">
          <textarea
            name="queryMessage"
            value={formData.queryMessage}
            onChange={handleChange}
          />
          <div>
            <button className="btn btn-secondary" type="button">⬆ Upload</button>
            <button className="btn btn-primary" type="button">⬇ Download</button>
          </div>
        </div>

        <label>Instant Reply Message</label>
        <div className="row-input">
          <textarea
            name="replyMessage"
            value={formData.replyMessage}
            onChange={handleChange}
          />
          <div>
            <button className="btn btn-secondary" type="button">⬆ Upload</button>
            <button className="btn btn-primary" type="button">⬇ Download</button>
          </div>
        </div>
      </div>

      {/* Previous queries table */}
      <div className="table-container">
        <h3>Previous Queries</h3>
        <table>
          <thead>
            <tr>
              <th>Query No</th>
              <th>Query Date</th>
              <th>Category</th>
              <th>Query Message</th>
              <th>Reply Message</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {previousQueries.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No previous queries
                </td>
              </tr>
            ) : (
              previousQueries.map((q, i) => (
                <tr key={i}>
                  <td>{q.queryNo}</td>
                  <td>{q.queryDate}</td>
                  <td>{q.category}</td>
                  <td>{q.queryMessage}</td>
                  <td>{q.replyMessage}</td>
                  <td>{q.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueryRegistration;
