// File: FAQPage.jsx
// ------------------
// Replace your existing component with this file. It uses "./FAQ.css" (leave as-is).

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFaq } from "../actions/queryActions"; // adjust path if needed
import DOMPurify from "dompurify";
import "./FAQ.css";

const CATEGORY_MAP = {
  0: "OFFICER",
  1: "AIRMEN",
  2: "CIVILIAN",
};

const ITEMS_PAGE_SIZE = 8;

/* --- Utilities --- */
function safeText(v) {
  return v === undefined || v === null ? "" : String(v);
}
function normalizeCat(cat) {
  if (typeof cat === "number") return cat;
  if (typeof cat === "string") {
    const n = parseInt(cat, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}
function groupFaqsByCategoryAndHeading(items = []) {
  const out = {};
  for (const it of items) {
    const cat = normalizeCat(it.cat);
    const heading = safeText(it.heading).trim() || "General";
    if (cat === null) continue;
    if (!out[cat]) out[cat] = { total: 0, headings: {} };
    out[cat].total += 1;
    if (!out[cat].headings[heading]) out[cat].headings[heading] = [];
    out[cat].headings[heading].push(it);
  }
  return out;
}

/* Build a compact page range for UI with ellipsis.
   Example outputs: [1, '...', 4,5,6, '...', 20] */
function buildPageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [];
  pages.push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

/* Small accessible Pagination component */
function Pagination({
  current,
  totalPages,
  onChange,
  ariaLabel = "Pagination",
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(current, totalPages);

  return (
    <nav className="faq-pagination" aria-label={ariaLabel} role="navigation">
      <button
        className="btn btn-ghost"
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        aria-label="Previous page"
        aria-disabled={current === 1}
      >
        Prev
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`ell-${idx}`} className="pagination-ellipsis" aria-hidden>
            &hellip;
          </span>
        ) : (
          <button
            key={p}
            className={`btn ${p === current ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onChange(p)}
            aria-current={p === current ? "page" : undefined}
            aria-label={`Go to page ${p}`}
          >
            {p}
          </button>
        )
      )}

      <button
        className="btn btn-ghost"
        onClick={() => onChange(Math.min(totalPages, current + 1))}
        disabled={current === totalPages}
        aria-label="Next page"
        aria-disabled={current === totalPages}
      >
        Next
      </button>
    </nav>
  );
}

/* --- Main Component --- */
export default function FAQPage() {
  const dispatch = useDispatch();

  // try a few common Redux shapes for cached data
  const reduxItems = useSelector((state) => {
    return (
      state?.faq?.byKey?.default?.items ||
      state?.faqReducer?.byKey?.default?.items ||
      state?.faqList?.items ||
      state?.faqs ||
      null
    );
  });

  const [items, setItems] = useState(
    Array.isArray(reduxItems) ? reduxItems : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState("");
  const [expandedHeadings, setExpandedHeadings] = useState(() => new Set());
  // perHeadingPage: { [heading]: pageNumber }
  const [perHeadingPage, setPerHeadingPage] = useState({});

  const fetchPromiseRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(reduxItems) && reduxItems.length > 0) {
      setItems(reduxItems);
      return;
    }

    setLoading(true);
    setError(null);
    const p = dispatch(fetchFaq());
    fetchPromiseRef.current = p;

    p.then((data) => {
      const arr = Array.isArray(data?.items) ? data.items : [];
      setItems(arr);
    })
      .catch((err) => {
        const message = err?.message || "Unable to load FAQs";
        setError(message);
      })
      .finally(() => setLoading(false));

    return () => {
      try {
        if (
          fetchPromiseRef.current &&
          typeof fetchPromiseRef.current.cancel === "function"
        ) {
          fetchPromiseRef.current.cancel();
        }
      } catch (e) {
        // ignore
      }
    };
  }, [dispatch]);

  // keep local items in sync if Redux updates
  useEffect(() => {
    if (Array.isArray(reduxItems) && reduxItems.length > 0)
      setItems(reduxItems);
  }, [reduxItems]);

  const grouped = useMemo(() => groupFaqsByCategoryAndHeading(items), [items]);

  const tabs = useMemo(
    () =>
      Object.keys(CATEGORY_MAP).map((k) => ({
        key: Number(k),
        label: CATEGORY_MAP[k],
      })),
    []
  );

  const tabCounts = useMemo(() => {
    const out = {};
    for (const t of tabs) out[t.key] = grouped[t.key]?.total || 0;
    return out;
  }, [grouped, tabs]);

  const filterForTabAndQuery = useCallback(
    (catNum) => {
      const catData = grouped[catNum];
      if (!catData) return {};
      const q = query.trim().toLowerCase();
      const out = {};
      for (const [heading, arr] of Object.entries(catData.headings)) {
        const filtered = q
          ? arr.filter((it) =>
              (safeText(it.question) + " " + safeText(it.answer))
                .toLowerCase()
                .includes(q)
            )
          : arr.slice();
        if (filtered.length > 0) out[heading] = filtered;
      }
      return out;
    },
    [grouped, query]
  );

  const visibleHeadings = useMemo(
    () => filterForTabAndQuery(activeTab),
    [activeTab, filterForTabAndQuery]
  );

  // Ensure perHeadingPage has defaults for visible headings (init to 1 if missing)
  useEffect(() => {
    if (!visibleHeadings) return;
    setPerHeadingPage((prev) => {
      const copy = { ...prev };
      for (const h of Object.keys(visibleHeadings)) {
        if (!copy[h]) copy[h] = 1;
      }
      return copy;
    });
  }, [visibleHeadings, query, activeTab]);

  const handleToggleHeading = (heading) => {
    setExpandedHeadings((prev) => {
      const clone = new Set(prev);
      if (clone.has(heading)) {
        clone.delete(heading);
      } else {
        clone.add(heading);
        // make sure pagination for heading is initialized
        setPerHeadingPage((p) => ({ ...p, [heading]: p[heading] || 1 }));
      }
      return clone;
    });
  };

  const handleExpandAll = () => {
    const all = new Set(Object.keys(visibleHeadings));
    setExpandedHeadings(all);
    // initialize pages to 1 for all visible headings
    setPerHeadingPage((prev) => {
      const copy = { ...prev };
      for (const h of Object.keys(visibleHeadings)) copy[h] = 1;
      return copy;
    });
  };
  const handleCollapseAll = () => setExpandedHeadings(new Set());

  const handlePageChange = (heading, page) => {
    setPerHeadingPage((prev) => ({ ...prev, [heading]: page }));
    // when user changes page, ensure heading expanded so they see content
    setExpandedHeadings((prev) => {
      const clone = new Set(prev);
      if (!clone.has(heading)) clone.add(heading);
      return clone;
    });
    // scroll heading into view for better UX (optional)
    setTimeout(() => {
      const el = document.getElementById(`heading-${cssSafeId(heading)}`);
      if (el && el.scrollIntoView)
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  function cssSafeId(str = "") {
    return String(str)
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
      .slice(0, 40);
  }

  const renderAnswer = (html) => {
    const unsafe = safeText(html);
    const sanitized = DOMPurify ? DOMPurify.sanitize(unsafe) : unsafe;
    return (
      <div
        className="faq-answer"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  };

  return (
    <div className="faq-page">
      <header className="faq-header">
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-sub">
          Browse FAQs by category or search questions &amp; answers
        </p>
      </header>

      <div className="faq-controls">
        <div className="faq-tabs" role="tablist" aria-label="FAQ categories">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={t.key === activeTab}
              onClick={() => {
                setActiveTab(t.key);
                // optional: reset search or other local state when changing tabs
                setExpandedHeadings(new Set());
              }}
              className={`faq-tab ${t.key === activeTab ? "active" : ""}`}
            >
              <span className="faq-tab-label">{t.label}</span>
              <span className="faq-tab-count">{`(${
                tabCounts[t.key] || 0
              })`}</span>
            </button>
          ))}
        </div>

        <div className="faq-actions">
          <div className="faq-search-wrap">
            <label htmlFor="faq-search" className="sr-only">
              Search FAQs
            </label>
            <input
              id="faq-search"
              className="faq-search"
              placeholder="Search question or answer..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // reset expand/pagination when search changes
                setPerHeadingPage({});
                setExpandedHeadings(new Set());
              }}
            />
          </div>

          <div className="faq-action-buttons">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPerHeadingPage({});
                setExpandedHeadings(new Set());
              }}
              aria-label="Clear search"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                const p = dispatch(fetchFaq({ force: true }));
                fetchPromiseRef.current = p;
                p.then((data) =>
                  setItems(Array.isArray(data?.items) ? data.items : [])
                )
                  .catch((err) => setError(err?.message || "Failed"))
                  .finally(() => setLoading(false));
              }}
              aria-label="Refresh FAQs"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="faq-panel">
        {loading ? (
          <div className="faq-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton-title" />
                <div className="skeleton-line" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="faq-error">
            <p className="faq-error-text">{error}</p>
            <div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  const p = dispatch(fetchFaq({ force: true }));
                  fetchPromiseRef.current = p;
                  p.then((data) =>
                    setItems(Array.isArray(data?.items) ? data.items : [])
                  )
                    .catch((err) => setError(err?.message || "Failed"))
                    .finally(() => setLoading(false));
                }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="faq-actions-compact">
              <button
                onClick={handleExpandAll}
                aria-label="Expand all headings"
              >
                Expand all
              </button>
              <button
                onClick={handleCollapseAll}
                aria-label="Collapse all headings"
              >
                Collapse all
              </button>
            </div>

            {Object.keys(visibleHeadings).length === 0 ? (
              <div className="faq-empty">
                No FAQs found for this category/search.
              </div>
            ) : (
              Object.entries(visibleHeadings).map(([heading, arr]) => {
                const isExpanded = expandedHeadings.has(heading);
                const currentPage = perHeadingPage[heading] || 1;
                const totalItems = arr.length;
                const totalPages = Math.max(
                  1,
                  Math.ceil(totalItems / ITEMS_PAGE_SIZE)
                );
                const pageIndex = Math.max(
                  1,
                  Math.min(currentPage, totalPages)
                );
                const startIdx = (pageIndex - 1) * ITEMS_PAGE_SIZE;
                const endIdx = Math.min(totalItems, startIdx + ITEMS_PAGE_SIZE);
                const pageSlice = arr.slice(startIdx, endIdx);

                return (
                  <section
                    key={heading}
                    className="faq-heading"
                    id={`heading-${cssSafeId(heading)}`}
                  >
                    <button
                      className="faq-heading-toggle"
                      onClick={() => handleToggleHeading(heading)}
                      aria-expanded={isExpanded}
                    >
                      <div>
                        <div className="faq-heading-title">{heading}</div>
                        <div className="faq-heading-meta">
                          {arr.length} question(s)
                        </div>
                      </div>
                      <div className="faq-heading-chev">
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="faq-questions">
                        {pageSlice.map((faq) => (
                          <article
                            key={`${faq.heading}_${faq.q_no}_${faq.question}`}
                            className="faq-item"
                          >
                            <details className="faq-item-details">
                              <summary className="faq-item-question">
                                <div className="faq-q-text">
                                  {safeText(faq.question)}
                                </div>
                                <div className="faq-q-no">
                                  Q No: {safeText(faq.q_no)}
                                </div>
                              </summary>
                              <div className="faq-item-answer">
                                {renderAnswer(faq.answer)}
                              </div>
                            </details>
                          </article>
                        ))}

                        {/* Pagination controls for this heading */}
                        {totalPages > 1 && (
                          <div
                            className="faq-pagination-wrap"
                            aria-hidden={totalPages <= 1 ? "true" : "false"}
                          >
                            <div className="faq-pagination-meta">
                              Showing {startIdx + 1}–{endIdx} of {totalItems}
                            </div>

                            <Pagination
                              current={pageIndex}
                              totalPages={totalPages}
                              onChange={(p) => handlePageChange(heading, p)}
                              ariaLabel={`Pagination for ${heading}`}
                            />
                          </div>
                        )}

                        {/* small spacer */}
                        <div style={{ height: 8 }} />
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
}
