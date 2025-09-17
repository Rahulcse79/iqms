// ProfileView.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import "./ProfileView.css";
import GCIHistoryTab from "./components/GCIHistoryTab";
import RankHistoryTab from "./components/RankHistoryTab";
import TradeHistoryTab from "./components/TradeHistoryTab";
import PostingHistoryTab from "./components/PostingHistoryTab";
import PORDataBankTab from "./components/PORDataBankTab";
import MVRHistoryTab from "./components/MVRHistoryTab";
import IRLAHistoryTab from "./components/IRLAHistoryTab";
import IQMSDetailsTab from "./components/IQMSdetailsTab";
import SearchSection from "./components/SearchSection";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPersonalData,
  getRankHistory,
  getTradeHistory,
  getPostingHistory,
} from "../../actions/ProfileAction";
import PersonalDetails from "./components/PersonalDetails";

const log = {
  debug: (...args) =>
    process.env.NODE_ENV !== "production" &&
    console.debug("[ProfileView]", ...args),
  error: (...args) => console.error("[ProfileView]", ...args),
};

const LazyComponent = ({ renderFn }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        renderFn()
      ) : (
        <div style={{ padding: 20, textAlign: "center" }}>Loading...</div>
      )}
    </div>
  );
};

const SECTIONS = [
  {
    id: "pd",
    label: "Personal Details",
    Component: PersonalDetails,
    icon: "user",
  },
  {
    id: "rank",
    label: "Rank History",
    Component: RankHistoryTab,
    icon: "rank",
  },
  {
    id: "trade",
    label: "Trade History",
    Component: TradeHistoryTab,
    icon: "trade",
  },
  {
    id: "gci",
    label: "GCI History",
    Component: GCIHistoryTab,
    icon: "history",
  },
  {
    id: "posting",
    label: "Posting History",
    Component: PostingHistoryTab,
    icon: "posting",
  },
    {
    id: "iqms",
    label: "IQMS details",
    Component: IQMSDetailsTab,
    icon: "chart",
  },
  {
    id: "por",
    label: "POR Data Bank",
    Component: PORDataBankTab,
    icon: "folder",
  },
  { id: "mvr", label: "MVR History", Component: MVRHistoryTab, icon: "drive" },
  { id: "irla", label: "IRLA History", Component: IRLAHistoryTab, icon: "doc" },

];

function SectionPicker({
  options,
  value,
  onChange,
  dropdownRef,
  placeholder = "Jump to section (Ctrl+K)",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listId = "section-picker-listbox";
  const inputId = "section-picker-input";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onDoc = (ev) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(ev.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => setHighlight(0), [query]);

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
      scrollHighlightedIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      scrollHighlightedIntoView();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = filtered[highlight];
      if (pick) handleSelect(pick.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const scrollHighlightedIntoView = () => {
    const el = document.getElementById(`${listId}-option-${highlight}`);
    if (el) el.scrollIntoView({ block: "nearest" });
  };

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      className="section-picker-wrapper"
      ref={(el) => {
        wrapperRef.current = el;
        if (typeof dropdownRef === "function") dropdownRef(el);
        else if (dropdownRef) dropdownRef.current = el;
      }}
    >
      <div
        className={`combobox ${open ? "combobox--open" : ""}`}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-owns={listId}
      >
        <div className="combobox-input-wrap">
          <input
            id={inputId}
            ref={inputRef}
            className="combobox-input"
            placeholder={placeholder}
            value={
              open ? query : options.find((s) => s.id === value)?.label ?? ""
            }
            onFocus={() => setOpen(true)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={
              open ? `${listId}-option-${highlight}` : undefined
            }
          />
          <button
            type="button"
            className="combobox-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => {
              setOpen((v) => !v);
              if (!open) setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="combobox-listbox"
            tabIndex={-1}
            aria-labelledby={inputId}
          >
            {filtered.length === 0 && (
              <li className="combobox-empty" role="option" aria-disabled="true">
                No sections match “{query}”
              </li>
            )}
            {filtered.map((opt, idx) => (
              <li
                key={opt.id}
                id={`${listId}-option-${idx}`}
                role="option"
                aria-selected={value === opt.id}
                className={`combobox-option ${
                  highlight === idx ? "combobox-option--highlighted" : ""
                } ${value === opt.id ? "combobox-option--selected" : ""}`}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(opt.id);
                }}
              >
                <span className="option-icon" aria-hidden>
                  {opt.icon === "user" && (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
                      />
                    </svg>
                  )}
                  {opt.icon === "rank" && (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2l3 6 6 .5-4.5 3.9L18 21 12 17.8 6 21l1.5-8.6L3 8.5 9 8z"
                      />
                    </svg>
                  )}
                  {opt.icon === "trade" && (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M3 6h18v2H3V6zm0 5h12v2H3v-2zm0 5h18v2H3v-2z"
                      />
                    </svg>
                  )}
                  {opt.icon === "posting" && (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M21 3H3v18h18V3zm-2 16H5V5h14v14z"
                      />
                    </svg>
                  )}
                  {(opt.icon === "history" ||
                    opt.icon === "folder" ||
                    opt.icon === "drive" ||
                    opt.icon === "doc" ||
                    opt.icon === "chart") && (
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M3 4h18v2H3V4zm0 4h18v12H3V8zm4 3v6l5-3-5-3z"
                      />
                    </svg>
                  )}
                </span>
                <span className="option-label">{opt.label}</span>
                {value === opt.id && (
                  <span className="option-selected-check" aria-hidden>
                    ✓
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="combobox-hint">
        Tip: press <kbd>Ctrl</kbd>+<kbd>K</kbd> to jump
      </div>
    </div>
  );
}

export default function ProfileView() {
  const [serviceNo, setServiceNo] = useState("");
  const [category, setCategory] = useState("1");
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("");
  const sectionRefs = useRef({});
  const dropdownRef = useRef(null);
  const placeholderRef = useRef(null);
  const observerRef = useRef(null);

  const [isPinned, setIsPinned] = useState(false);
  const [pinStyle, setPinStyle] = useState({ left: 0, width: "auto" });
  const [pinThreshold, setPinThreshold] = useState(null);

  const dispatch = useDispatch();

  const personalSlice = useSelector((s) => s.personalData || {});
  const profileViewSlice = useSelector((s) => s.profileView || {});
  const userSlice = useSelector((s) => s.user ?? s.login_user ?? {});

  const rankHistory = profileViewSlice.rankHistory || {};
  const tradeHistory = profileViewSlice.tradeHistory || {};
  const postingHistory = profileViewSlice.postingHistory || {};

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        console.groupCollapsed("[ProfileView] Redux slices snapshot");
        console.log("profileView keys:", Object.keys(profileViewSlice || {}));
        console.log("rankHistory present:", !!profileViewSlice?.rankHistory);
        console.log(
          "rankHistory.items length:",
          Array.isArray(profileViewSlice?.rankHistory?.items)
            ? profileViewSlice.rankHistory.items.length
            : typeof profileViewSlice?.rankHistory?.items
        );
        console.log(
          "tradeHistory.items length:",
          Array.isArray(profileViewSlice?.tradeHistory?.items)
            ? profileViewSlice.tradeHistory.items.length
            : typeof profileViewSlice?.tradeHistory?.items
        );
        console.log(
          "postingHistory.items length:",
          Array.isArray(profileViewSlice?.postingHistory?.items)
            ? profileViewSlice.postingHistory.items.length
            : typeof profileViewSlice?.postingHistory?.items
        );
        console.groupEnd();
      } catch (e) {
        // no-op
      }
    }
  }, [profileViewSlice]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [
        dispatch(fetchPersonalData(serviceNo, category)),
        dispatch(getRankHistory(serviceNo, category, 1)),
        dispatch(getTradeHistory(serviceNo, category, 1)),
        dispatch(getPostingHistory(serviceNo, category, 1)),
      ];

      const results = await Promise.allSettled(promises);
      results.forEach((r, idx) => {
        if (r.status === "rejected") {
          log.error("API failed:", idx, r.reason);
        }
      });

      setShowProfile(true);
    } catch (err) {
      setError("Something went wrong while fetching data.");
      log.error("Search Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!serviceNo.trim()) return alert("Please enter a service number.");
    await fetchAllData();
  };

  const handleRetry = () => fetchAllData();

  const measureDropdown = useCallback(() => {
    const el = dropdownRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    setPinThreshold(Math.round(absoluteTop));
    setPinStyle({
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }, []);

  useEffect(() => {
    if (!showProfile) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (pinThreshold === null) return;
        const scrollY = window.scrollY || window.pageYOffset;
        const headerOffset = 0;
        if (scrollY + headerOffset >= pinThreshold - 1) {
          if (!isPinned) setIsPinned(true);
        } else {
          if (isPinned) setIsPinned(false);
        }
      });
    };

    measureDropdown();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measureDropdown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measureDropdown);
    };
  }, [showProfile, pinThreshold, isPinned, measureDropdown]);

  useLayoutEffect(() => {
    if (!showProfile) return;
    const el = dropdownRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      measureDropdown();
      return;
    }
    measureDropdown();
    const ro = new ResizeObserver(() => {
      measureDropdown();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [showProfile, measureDropdown]);

  const scrollToSectionWithOffset = useCallback(
    (id) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const stickyHeight =
        (isPinned
          ? pinStyle.height || 0
          : dropdownRef.current?.getBoundingClientRect?.().height) || 0;
      const extraSpacing = 12;
      const targetY =
        el.getBoundingClientRect().top +
        window.scrollY -
        stickyHeight -
        extraSpacing;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    },
    [isPinned, pinStyle.height]
  );

  useEffect(() => {
    if (!showProfile) return;
    if (SECTIONS && SECTIONS.length)
      setActiveSection((prev) => (prev ? prev : SECTIONS[0].id));
  }, [showProfile]);

  useEffect(() => {
    if (!showProfile) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const headerOffset = isPinned
      ? pinStyle.height || 0
      : dropdownRef.current?.getBoundingClientRect?.().height || 0;
    const topMarginPx = -Math.round(headerOffset + 8);
    const bottomMargin = "-40%";

    const options = {
      root: null,
      rootMargin: `${topMarginPx}px 0px ${bottomMargin} 0px`,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const observer = new IntersectionObserver((entries) => {
      let best = null;
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.intersectionRatio < 0.05) return;
        if (!best || entry.intersectionRatio > best.intersectionRatio) {
          best = { id: entry.target.id, ratio: entry.intersectionRatio };
        }
      });
      if (best) setActiveSection((prev) => (prev !== best.id ? best.id : prev));
    }, options);

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [showProfile, isPinned, pinStyle.height]);

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  const onSectionSelect = (id) => {
    setActiveSection(id);
    scrollToSectionWithOffset(id);
  };

  return (
    <div className="profile-view-container">
      <SearchSection
        serviceNo={serviceNo}
        setServiceNo={setServiceNo}
        category={category}
        setCategory={setCategory}
        handleSearch={handleSearch}
      />

      {loading && <div className="loading-overlay">Loading profile...</div>}

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button
            onClick={handleRetry}
            className="retry-btn"
            aria-label="Retry"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && showProfile && !error && (
        <div className="result-section" style={{ overflow: "visible" }}>
          <div
            ref={placeholderRef}
            className="dropdown-placeholder"
            style={{ height: isPinned ? `${pinStyle.height || 0}px` : "0px" }}
            aria-hidden
          />

          <div
            className={`dropdown-sticky dropdown-sticky--pinable ${
              isPinned ? "dropdown-sticky--pinned" : ""
            }`}
            ref={dropdownRef}
          >
            <SectionPicker
              options={SECTIONS}
              value={activeSection}
              onChange={onSectionSelect}
              dropdownRef={dropdownRef}
            />
          </div>

          <div className="sections-container">
            {SECTIONS.map(({ id, Component, label }) => {
              // prepare tab props from profileView slice (this is the important fix)
              let tabProps = {};
              if (id === "rank") tabProps = rankHistory;
              if (id === "trade") tabProps = tradeHistory;
              if (id === "posting") tabProps = postingHistory;

              // debug the props being passed to the component (dev only)
              if (process.env.NODE_ENV !== "production") {
                try {
                  console.groupCollapsed(`[ProfileView] render section ${id}`);
                  console.log("tabProps keys:", Object.keys(tabProps || {}));
                  console.log(
                    "items type:",
                    Array.isArray(tabProps?.items)
                      ? "array"
                      : typeof tabProps?.items
                  );
                  if (Array.isArray(tabProps?.items)) {
                    console.log("items length:", tabProps.items.length);
                    // show up to first 5 rows to avoid huge output
                    console.table(tabProps.items.slice(0, 5));
                  } else {
                    console.log("tabProps (non-array items):", tabProps);
                  }
                  
                  console.groupEnd();
                } catch (e) {
                  // noop
                }
              }

              return (
                <div
                  key={id}
                  id={id}
                  ref={(el) => (sectionRefs.current[id] = el)}
                  className={`profile-section ${
                    activeSection === id ? "active-section" : ""
                  }`}
                >
                  <h2 className="section-title">{label}</h2>
                  <div className="section-content">
                    <LazyComponent
                      renderFn={() =>
                        id === "iqms" ? (
                          <Component {...tabProps} serviceNumber={serviceNo} serviceNo={serviceNo} category={category} />
                        ) : (
                          <Component {...tabProps} />
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
