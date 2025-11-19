import React, { useEffect, useRef, useState } from "react";
import versionData from "../assets/Data/versionControlData";
import "./versionNoticeBoard.css";

export default function VersionNoticeBoard() {
  const builds = versionData.builds || [];
  const heading = versionData.heading || "Release Notes";
  
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState("next");

  const AUTOPLAY_INTERVAL = 5000; // 5 seconds per slide
  const PROGRESS_UPDATE_INTERVAL = 50; // Update progress bar every 50ms

  // Auto-advance with progress tracking
  useEffect(() => {
    if (isPaused || builds.length <= 1) {
      setProgress(0);
      return;
    }

    let progressTimer;
    let slideTimer;
    let currentProgress = 0;

    const updateProgress = () => {
      currentProgress += (PROGRESS_UPDATE_INTERVAL / AUTOPLAY_INTERVAL) * 100;
      setProgress(Math.min(currentProgress, 100));
    };

    progressTimer = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL);

    slideTimer = setTimeout(() => {
      setDirection("next");
      setActive((p) => (p + 1) % builds.length);
      setProgress(0);
    }, AUTOPLAY_INTERVAL);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(slideTimer);
    };
  }, [active, isPaused, builds.length]);

  // Smooth scroll to active card
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const child = el.children[active];
    if (!child) return;
    
    const offset = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: offset, behavior: "smooth" });
  }, [active]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") {
        setDirection("next");
        setActive((p) => (p + 1) % builds.length);
        setProgress(0);
      }
      if (e.key === "ArrowLeft") {
        setDirection("prev");
        setActive((p) => (p - 1 + builds.length) % builds.length);
        setProgress(0);
      }
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [builds.length]);

  const goToSlide = (index) => {
    setDirection(index > active ? "next" : "prev");
    setActive(index);
    setProgress(0);
  };

  const nextSlide = () => {
    setDirection("next");
    setActive((p) => (p + 1) % builds.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setDirection("prev");
    setActive((p) => (p - 1 + builds.length) % builds.length);
    setProgress(0);
  };

  const openModal = (build) => {
    setModalContent(build);
    setShowModal(true);
    setIsPaused(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
    setIsPaused(false);
  };

  const getTagColor = (type) => {
    const lowerType = (type || "").toLowerCase();
    if (lowerType.includes("critical") || lowerType.includes("major")) return "tag-red";
    if (lowerType.includes("feature") || lowerType.includes("new")) return "tag-green";
    if (lowerType.includes("update") || lowerType.includes("enhancement")) return "tag-amber";
    return "tag-blue";
  };

  if (!builds.length) {
    return (
      <div className="notice-wrapper">
        <p className="notice-empty">No notices available.</p>
      </div>
    );
  }

  return (
    <div className="notice-wrapper">
      {/* Header */}
      <div className="notice-heading-row">
        <h2 className="notice-title">{heading}</h2>
        <div className="notice-controls">
          <button
            className="notice-control-btn"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? "Resume autoplay" : "Pause autoplay"}
          >
            {isPaused ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            )}
          </button>
          <span className="notice-latest">
            {active + 1} / {builds.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="notice-progress-container">
        <div 
          className="notice-progress-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Carousel */}
      <div className="notice-carousel">
        {/* Navigation Arrows */}
        <button
          className="notice-arrow left"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <button
          className="notice-arrow right"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Cards Container */}
        <div
          className="notice-scroll"
          ref={containerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {builds.map((b, i) => (
            <div
              key={i}
              className={`notice-card ${i === active ? "active" : ""} ${
                i === active ? `slide-${direction}` : ""
              }`}
              onClick={() => goToSlide(i)}
            >
              {/* Card Header */}
              <div className="notice-card-header">
                <div className="notice-version-row">
                  <h3 className="notice-version">{b.version || `v${i + 1}.0`}</h3>
                  <span className={`notice-tags ${getTagColor(b.type)}`}>
                    {b.type || "Update"}
                  </span>
                </div>
                <p className="notice-date">{b.date || "Recently"}</p>
              </div>

              {/* Card Body */}
              <div className="notice-card-body">
                <p className="notice-description">{b.description || "No description available."}</p>
                
                {/* Highlights */}
                {b.highlights?.length ? (
                  <ul className="notice-list">
                    {b.highlights.slice(0, 4).map((h, idx) => (
                      <li key={idx}>{h}</li>
                    ))}
                    {b.highlights.length > 4 && (
                      <li className="notice-more">+{b.highlights.length - 4} more</li>
                    )}
                  </ul>
                ) : (
                  <ul className="notice-list">
                    <li className="notice-no-highlights">No highlights provided.</li>
                  </ul>
                )}
              </div>

              {/* Card Footer */}
              <div className="notice-card-footer">
                <div className="notice-author">
                  <span>By {b.author || "Team"}</span>
                </div>
                {b.fullNotes && (
                  <button
                    className="notice-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(b);
                    }}
                  >
                    Read More →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="notice-dots">
        {builds.map((_, i) => (
          <button
            key={i}
            className={`notice-dot ${i === active ? "active" : ""}`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Modal */}
      {showModal && modalContent && (
        <div className="notice-modal-bg" onClick={closeModal}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalContent.version || "Release Notes"}</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="modal-meta">
                <span className={`notice-tags ${getTagColor(modalContent.type)}`}>
                  {modalContent.type || "Update"}
                </span>
                <span className="modal-date">{modalContent.date}</span>
              </div>
              <p className="modal-description">{modalContent.description}</p>
              <div className="modal-notes">{modalContent.fullNotes}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
