/**
 * NewQuery.jsx
 * - Child form used inside QueryView modal
 * - Props:
 *   - service: service object (required)
 *   - onClose: function to close modal
 *   - onCreate: function(payload) called after validation and when user submits
 *
 * Note: component builds the payload and calls onCreate(payload). The parent (QueryView)
 * is responsible for persisting via data.createQuery and updating UI.
 */

import React, { useMemo, useState, useRef } from "react";
import { FiSave, FiRotateCcw, FiX, FiAlertCircle } from "react-icons/fi";
import "./NewQuery.css";

const CATEGORY_OPTIONS = {
  Leave: ["Annual Leave", "Medical Leave", "Emergency Leave"],
  Documents: ["Service Record", "ID Card", "NOC"],
  Payroll: ["Salary Discrepancy", "Payslip Request", "Tax Form"],
  IT: ["Password Reset", "Account Access", "System Issue"],
  Other: ["General Query"],
};
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const MODE_OPTIONS = ["Online", "Email", "Phone", "In-Person", "Letter"];

function generateQueryNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const t = String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
  return `Q-${y}${m}${day}-${t}-${Math.floor(Math.random() * 900 + 100)}`;
}

export default function NewQuery({ service, onClose = () => {}, onCreate = () => {} }) {
  const [form, setForm] = useState({
    category: "",
    subCategory: "",
    queryPriority: "",
    modeOfQuery: "",
    queryMessage: "",
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const refs = useRef({});
  const MESSAGE_MAX = 1000;
  const messageLen = form.queryMessage.length;
  const subcategoryList = useMemo(() => CATEGORY_OPTIONS[form.category] || [], [form.category]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function scrollToField(key) {
    const el = refs.current[key];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = el.querySelector("input, select, textarea");
      if (input) input.focus();
    }
  }

  function validate() {
    const e = {};
    if (!service || !service.serviceNo) e.service = "No service provided.";
    if (!form.category) e.category = "Category is required";
    if (!form.subCategory) e.subCategory = "Sub-category is required";
    if (!form.queryPriority) e.queryPriority = "Priority is required";
    if (!form.modeOfQuery) e.modeOfQuery = "Mode is required";
    if (!form.queryMessage) e.queryMessage = "Please describe your query";
    if (messageLen > MESSAGE_MAX) e.queryMessage = `Max ${MESSAGE_MAX} characters`;

    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      setTimeout(() => scrollToField(firstKey), 50);
      return false;
    }
    return true;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      // include service identifiers so parent can persist correctly
      serviceNo: service.serviceNo,
      rank: service.rank,
      firstName: service.firstName,
      middleName: service.middleName,
      lastName: service.lastName,
      isdCode: service.isdCode,
      mobile: service.mobile,
      email: service.email,

      // query details
      category: form.category,
      subCategory: form.subCategory,
      queryPriority: form.queryPriority,
      modeOfQuery: form.modeOfQuery,
      queryMessage: form.queryMessage,
      // parent may add more fields (queryDate, status) when persisting
    };

    // tell parent to persist
    try {
      onCreate(payload);
      setSubmitted(payload);
      // NOTE: parent usually closes modal; we don't assume it but allow parent to decide.
    } catch (err) {
      console.error("onCreate handler threw:", err);
      alert("Failed to create query (see console)");
    }
  }

  function handleReset() {
    setForm({
      category: "",
      subCategory: "",
      queryPriority: "",
      modeOfQuery: "",
      queryMessage: "",
    });
    setErrors({});
    setSubmitted(null);
  }

  return (
    <div className="nq-container">
      <header className="nq-header" style={{ maxWidth: 960, margin: "0 auto 10px" }}>
        <div className="nq-left">
          <div className="nq-breadcrumbs">Dashboard / <span>New Query</span></div>
          <h1 className="nq-title">Create New Query</h1>
          <div className="nq-subtitle">Linked to service <strong>{service?.serviceNo}</strong></div>
        </div>
        <div style={{ textAlign: "right" }}>
          {service ? (
            <div style={{ fontSize: 13, color: "#374151" }}>
              Creating for <strong>{service.serviceNo}</strong> — {service.firstName} {service.lastName}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#b91c1c" }}>No service loaded</div>
          )}
        </div>
      </header>

      {/* service card */}
      {service && (
        <div style={{ maxWidth: 960, margin: "0 auto 12px" }}>
          <div className="svc-card card">
            <div className="svc-left">
              <div className="avatar">{(service.firstName || "U").charAt(0)}</div>
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontWeight: 700 }}>{service.firstName} {service.middleName} {service.lastName}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{service.rank} • {service.region}</div>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>+{service.isdCode} {service.mobile} • {service.email}</div>
              </div>
            </div>
            <div className="svc-right">
              <div style={{ textAlign: "right", color: "var(--muted)" }}>
                <div>Service No</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{service.serviceNo}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* form */}
      {!submitted ? (
        <form className="nq-form" onSubmit={handleSubmit} noValidate style={{ maxWidth: 960, margin: "0 auto" }}>
          <section className="nq-card">
            <div className="nq-card-head">
              <h2>Query Details</h2>
              <div className="nq-hint">These fields create a ticket linked to the service.</div>
            </div>

            <div className="nq-grid">
              <div className={`nq-field ${errors.category ? "has-error" : ""}`} ref={(el) => (refs.current.category = el)}>
                <label>Category <span className="nq-req">*</span></label>
                <select value={form.category} onChange={(e) => setField("category", e.target.value)}>
                  <option value="">Select category</option>
                  {Object.keys(CATEGORY_OPTIONS).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <div className="nq-error"><FiAlertCircle /> {errors.category}</div>}
              </div>

              <div className={`nq-field ${errors.subCategory ? "has-error" : ""}`} ref={(el) => (refs.current.subCategory = el)}>
                <label>Sub-category <span className="nq-req">*</span></label>
                <select value={form.subCategory} onChange={(e) => setField("subCategory", e.target.value)} disabled={!form.category}>
                  <option value="">{form.category ? "Select sub-category" : "Select category first"}</option>
                  {subcategoryList.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.subCategory && <div className="nq-error"><FiAlertCircle /> {errors.subCategory}</div>}
              </div>

              <div className={`nq-field ${errors.queryPriority ? "has-error" : ""}`} ref={(el) => (refs.current.queryPriority = el)}>
                <label>Priority <span className="nq-req">*</span></label>
                <select value={form.queryPriority} onChange={(e) => setField("queryPriority", e.target.value)}>
                  <option value="">Select priority</option>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.queryPriority && <div className="nq-error"><FiAlertCircle /> {errors.queryPriority}</div>}
              </div>

              <div className={`nq-field ${errors.modeOfQuery ? "has-error" : ""}`} ref={(el) => (refs.current.modeOfQuery = el)}>
                <label>Mode of Query <span className="nq-req">*</span></label>
                <select value={form.modeOfQuery} onChange={(e) => setField("modeOfQuery", e.target.value)}>
                  <option value="">Select mode</option>
                  {MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.modeOfQuery && <div className="nq-error"><FiAlertCircle /> {errors.modeOfQuery}</div>}
              </div>

              <div className={`nq-field nq-span-2 ${errors.queryMessage ? "has-error" : ""}`} ref={(el) => (refs.current.queryMessage = el)}>
                <label>Query Message <span className="nq-req">*</span></label>
                <textarea value={form.queryMessage} onChange={(e) => setField("queryMessage", e.target.value.slice(0, MESSAGE_MAX))} placeholder="Clearly describe the issue or request..." />
                <div className="nq-field-foot">
                  <div className="nq-hint">Do not include sensitive information unless requested.</div>
                  <div className={`nq-counter ${messageLen > MESSAGE_MAX - 50 ? "warn" : ""}`}>{messageLen}/{MESSAGE_MAX}</div>
                </div>
                {errors.queryMessage && <div className="nq-error"><FiAlertCircle /> {errors.queryMessage}</div>}
              </div>
            </div>
          </section>

          <div className="nq-actions" style={{ maxWidth: 960 }}>
            <button type="button" className="btn btn-secondary" onClick={handleReset}><FiRotateCcw /> Reset</button>
            <div className="nq-actions-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}><FiX /> Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!service || !service.serviceNo}><FiSave /> Create Query</button>
            </div>
          </div>
        </form>
      ) : (
        <section className="nq-card nq-summary" style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2>Query Created</h2>
          <p>The query has been created and is linked to <strong>{submitted.serviceNo}</strong>.</p>
          <pre className="nq-payload">{JSON.stringify(submitted, null, 2)}</pre>
          <div className="nq-summary-actions" style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => { setSubmitted(null); handleReset(); }}>Create Another</button>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </section>
      )}
    </div>
  );
}
