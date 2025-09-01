import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { searchByServiceNoAndCategory } from "../../actions/queryActions";
import QueriesTable from "../../components/QueriesTable";
import "./QueryComparison.css";

const ALLOWED_CATEGORIES = ["Airmen", "Officer"];
const NUM_SLOTS = 3;

const normalize = (v = "") => v.trim();

const Comparison = () => {
  const dispatch = useDispatch();

  // inputs for three slots
  const [inputs, setInputs] = useState(
    Array.from({ length: NUM_SLOTS }, () => ({ serviceNo: "", category: "Airmen" }))
  );

  // local UI state
  const [panelData, setPanelData] = useState(Array.from({ length: NUM_SLOTS }, () => []));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [touched, setTouched] = useState(false); // has user pressed Search at least once?
  const [fieldErrors, setFieldErrors] = useState(Array.from({ length: NUM_SLOTS }, () => "")); // per-field error

  const setInputField = (index, field, value) => {
    setInputs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // clear per-field error when editing
    setFieldErrors((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  // active slots (only those with a serviceNo)
  const activeSlots = useMemo(
    () =>
      inputs
        .map((inp, idx) => ({ ...inp, index: idx, serviceNo: normalize(inp.serviceNo) }))
        .filter((x) => x.serviceNo),
    [inputs]
  );

  const validate = () => {
    const perField = Array.from({ length: NUM_SLOTS }, () => "");
    let error = null;

    const entries = inputs.map((i) => ({
      serviceNo: normalize(i.serviceNo),
      category: i.category,
    }));

    // at least one
    if (entries.every((e) => !e.serviceNo)) {
      error = "Please enter at least one Service Number.";
    }

    // numeric + reasonable length (adjust to your real rule)
    entries.forEach((e, idx) => {
      if (!e.serviceNo) return;
      if (!/^\d+$/.test(e.serviceNo)) {
        perField[idx] = "Only digits are allowed.";
      } else if (e.serviceNo.length < 5 || e.serviceNo.length > 12) {
        perField[idx] = "Length must be 5–12 digits.";
      }
      if (!ALLOWED_CATEGORIES.includes(e.category)) {
        perField[idx] = "Invalid category.";
      }
    });

    // unique
    const nos = entries.map((e) => e.serviceNo).filter(Boolean);
    const hasDup = new Set(nos).size !== nos.length;
    if (hasDup) {
      error = "Please enter different Service Numbers to compare.";
    }

    // surface first non-empty field error as banner if no global error yet
    if (!error) {
      const firstFieldErr = perField.find((msg) => msg);
      if (firstFieldErr) error = "Please fix the highlighted fields.";
    }

    setFieldErrors(perField);
    setFormError(error);
    return !error;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!validate()) return;

    setLoading(true);
    setFormError(null);

    // prepare empty results for visible slots only
    const nextData = Array.from({ length: NUM_SLOTS }, () => []);

    try {
      await Promise.all(
        activeSlots.map(async ({ serviceNo, category, index }) => {
          try {
            // NOTE: your thunk should `return data` for this to work.
            const data = await dispatch(
              searchByServiceNoAndCategory(serviceNo, category, index + 1)
            );

            const items = (data?.items || []).map((item) => ({
              queryId: item.doc_id,
              type: item.querytype,
              serviceNo,
              pendingWith: item.pending_with_dec,
              date: new Date(item.submit_date).toLocaleDateString(),
            }));

            nextData[index] = items;
          } catch (err) {
            console.error(`Error fetching slot ${index + 1}`, err);
            // keep that slot empty but don’t crash the entire page
          }
        })
      );
      setPanelData(nextData);
    } catch (err) {
      console.error("Unexpected error:", err);
      setFormError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputs(Array.from({ length: NUM_SLOTS }, () => ({ serviceNo: "", category: "Airmen" })));
    setPanelData(Array.from({ length: NUM_SLOTS }, () => []));
    setFieldErrors(Array.from({ length: NUM_SLOTS }, () => ""));
    setFormError(null);
    setTouched(false);
  };

  // Panels to render (only for entered service numbers)
  const panels = useMemo(() => {
    if (!touched) return [];
    // only render cards for slots the user actually searched
    return activeSlots.map(({ index, serviceNo, category }) => ({
      index,
      serviceNo,
      category,
      data: panelData[index] || [],
    }));
  }, [touched, activeSlots, panelData]);

  const gridColumns = Math.max(1, panels.length || 1); // at least 1 to keep layout stable

  return (
    <div className="comparison-container">
      <h2>Query Comparison</h2>

      <form className="comparison-form" onSubmit={handleSearch} noValidate>
        <div className="service-numbers-row">
          {inputs.map((inp, i) => (
            <div key={i} className="input-block">
              <label htmlFor={`sn-${i}`}>Service Number {i + 1}</label>
              <input
                id={`sn-${i}`}
                type="text"
                inputMode="numeric"
                placeholder={`Enter number ${i + 1}`}
                value={inp.serviceNo}
                className={fieldErrors[i] ? "invalid" : ""}
                onChange={(e) => setInputField(i, "serviceNo", e.target.value)}
              />
              <label htmlFor={`cat-${i}`} className="sr-only">
                Category
              </label>
              <select
                id={`cat-${i}`}
                value={inp.category}
                onChange={(e) => setInputField(i, "category", e.target.value)}
              >
                {ALLOWED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {fieldErrors[i] && <div className="field-error">{fieldErrors[i]}</div>}
            </div>
          ))}
        </div>

        <div className="actions-row">
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
          <button type="button" className="btn ghost" onClick={handleReset} disabled={loading}>
            Reset
          </button>
        </div>

        {formError && (
          <div className="form-error" role="alert" aria-live="assertive">
            {formError}
          </div>
        )}
      </form>

      {/* Results */}
      {touched && (
        <div
          className="results-grid"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(320px, 1fr))` }}
        >
          {panels.length === 0 ? (
            <div className="empty-page-note">
              No service numbers were entered.
            </div>
          ) : (
            panels.map((p) => (
              <section key={p.index} className="result-card" aria-busy={loading ? "true" : "false"}>
                <header className="card-header">
                  <div className="card-title">
                    <span className="badge">{p.category}</span>
                    <h3 title={p.serviceNo}>{p.serviceNo}</h3>
                  </div>
                  <div className="card-subtitle">
                    {p.data.length > 0 ? `${p.data.length} queries` : "No queries found"}
                  </div>
                </header>

                <div className="card-body">
                  {p.data.length > 0 ? (
                    <div className="table-scroll">
                      <QueriesTable
                        title={`Service No ${p.serviceNo} (${p.category})`}
                        data={p.data}
                      />
                    </div>
                  ) : (
                    <div className="panel-empty">
                      No queries for this service number.
                    </div>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Comparison;
