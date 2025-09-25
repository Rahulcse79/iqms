import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Inauguration.css";

// Make sure these files exist
import logo1 from "../assets/Images/login-logo1.png";
import logo2 from "../assets/Images/login-logo.png";
import logo3 from "../assets/Images/dav-logo.png";
import ribbon from "../assets/Images/ribbon-img.png"
const Inauguration = ({
  duration = 2400,
  showConfetti = false,
  onComplete,
  className,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLogos, setShowLogos] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0); // 0 = none, 1 = logo1, 2 = logo2, 3 = logo3
  const [showContent, setShowContent] = useState(false);

  const rootRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const timersRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const handleReveal = () => {
    if (isAnimating || isRevealed) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setIsAnimating(true);

    if (prefersReducedMotion) {
      // skip animations for reduced motion users
      setIsRevealed(true);
      setShowContent(true);
      setIsAnimating(false);
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    // start reveal
    setIsRevealed(true);

    // Timing plan:
    // - wait for curtains to open (curtainOpenTime)
    // - show 3 logos in sequence, each visible for logoVisibleMs, with a small gap between
    const curtainOpenTime = Math.max(600, Math.round(duration * 0.7)); // ms
    const logoVisibleMs = 1600; // how long each logo frame remains (ms)
    const gapBetweenLogos = 300; // small gap between logos
    const endDelay = 200; // final small gap before showing content

    // After curtains open, run the logo sequence
    const t0 = setTimeout(() => {
      setShowLogos(true);
      setLogoIndex(1);

      // switch to second logo
      const t1 = setTimeout(() => {
        setLogoIndex(2);
      }, logoVisibleMs + gapBetweenLogos);
      timersRef.current.push(t1);

      // switch to third logo
      const t2 = setTimeout(() => {
        setLogoIndex(3);
      }, (logoVisibleMs + gapBetweenLogos) * 2);
      timersRef.current.push(t2);

      // finish logos; hide overlay, show content
      const totalLogoTime = logoVisibleMs * 3 + gapBetweenLogos * 2 + endDelay;
      const t3 = setTimeout(() => {
        setShowLogos(false);
        setLogoIndex(0);
        setShowContent(true);
        setIsAnimating(false);
        if (onCompleteRef.current) onCompleteRef.current();
      }, totalLogoTime);
      timersRef.current.push(t3);
    }, curtainOpenTime);

    timersRef.current.push(t0);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleReveal();
    }
  };

  const handleMoveNext = () => {
    navigate("/login");
  };

  // CSS class toggles
  const rootClass = [
    "inauguration-container",
    isRevealed ? "is-revealed" : "",
    isAnimating ? "is-animating" : "",
    showConfetti ? "with-confetti" : "",
    showContent ? "content-visible" : "",
    className || "",
  ]
    .join(" ")
    .trim();

  const style = { "--animation-duration": `${duration}ms` };

  // sprinklers (unchanged)
  const sprinklerCount = 72;
  const sprinklers = useMemo(() => {
    return Array.from({ length: sprinklerCount }).map((_, i) => {
      const leftPct = (i / sprinklerCount) * 100;
      const delay = (i % 24) * 0.25;
      const hue = (i * 13) % 360;
      const size = 8 + (i % 3);
      const speed = 2 + (i % 5);
      return { i, leftPct, delay, hue, size, speed };
    });
  }, [sprinklerCount]);

  return (
    <>
      <div
        ref={rootRef}
        className={rootClass}
        style={style}
        role="dialog"
        aria-modal="true"
      >
        {/* Curtains (no text inside them anymore) */}
        <div className="curtain curtain-left" aria-hidden={showContent} />
        <div className="curtain curtain-right" aria-hidden={showContent} />

        {/* Ribbon (click to cut) */}
        {!isRevealed && (
          <div
            className="ribbon-wrapper"
            role="button"
            tabIndex={0}
            onClick={handleReveal}
            onKeyDown={handleKeyDown}
            aria-label="Cut the ribbon to reveal"
          >
            <div className="ribbon-left" />
            <div className="ribbon-right" />

            {/* Left label */}
            <div className="ribbon-label ribbon-label-left">Welcome to</div>

            {/* Bow in the center */}
            <div className="ribbon-bow" aria-hidden="true">
              <img src={ribbon} alt="Ribbon"/>
            </div>

            {/* Right label */}
            <div className="ribbon-label ribbon-label-right">
              IVRS Inauguration
            </div>
          </div>
        )}

        {/* Scissors */}
        <div className="scissors-container" aria-hidden="true">
          <svg
            className="scissors-svg"
            viewBox="0 0 128 128"
            focusable="false"
            style={{ transformOrigin: "50% 50%" }}
          >
            <circle cx="36" cy="48" r="16" fill="currentColor" opacity="0.9" />
            <circle cx="36" cy="80" r="16" fill="currentColor" opacity="0.9" />
            <g className="scissors-blades" fill="currentColor">
              <rect x="60" y="60" width="60" height="6" rx="3" />
              <rect
                x="60"
                y="62"
                width="60"
                height="6"
                rx="3"
                transform="rotate(12 60 62)"
              />
            </g>
          </svg>
        </div>

        {/* Logo overlay sequence */}
        {showLogos && (
          <div className="logo-overlay" aria-hidden="true">
            <div key={`logo-${logoIndex}`} className="logo-credits">
              {logoIndex === 1 && <img src={logo1} alt="IVRS Logo 1" />}
              {logoIndex === 2 && <img src={logo2} alt="IVRS Logo 2" />}
              {logoIndex === 3 && <img src={logo3} alt="IVRS Logo 3" />}
            </div>
          </div>
        )}

        {/* Inauguration content with IVRS description */}
        <div className="inauguration-content" aria-hidden={!showContent}>
          {showContent && (
            <>
              <h1>Welcome to the Inauguration of the IVRS</h1>
              <p>
                The <strong>Interactive Voice Response System (IVRS)</strong> is
                a state-of-the-art platform designed to automate and streamline
                voice interactions. It empowers faster response times, reduces
                manual workload, and enhances efficiency in communication
                processes across the Indian Air Force.
              </p>
              <p>
                With advanced voice automation capabilities, the IVRS will
                provide a more reliable, scalable, and digital-first approach to
                handling queries and workflows, setting a strong foundation for
                modernized communication.
              </p>
              {!isAnimating && (
                <button
                  className="inauguration-next-btn"
                  type="button"
                  onClick={handleMoveNext}
                >
                  Proceed
                </button>
              )}
            </>
          )}
        </div>

        {/* Confetti */}
        {showConfetti &&
          showContent &&
          Array.from({ length: 50 }).map((_, i) => (
            <span
              key={`conf-${i}`}
              className="confetti-piece"
              style={{ "--i": i }}
            />
          ))}

        {/* Spark burst */}
        {isRevealed && (
          <div className="poppers" aria-hidden="true">
            {Array.from({ length: 36 }).map((_, i) => {
              const distance = 28 + (i % 12) * 3;
              const size = 4 + (i % 3);
              return (
                <span
                  key={`spark-${i}`}
                  className="popper-spark"
                  style={{
                    "--i": i,
                    "--burst-distance": `${distance}px`,
                    "--spark-size": `${size}px`,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Continuous sprinklers */}
        {showContent && (
          <div className="sprinklers" aria-hidden="true">
            {sprinklers.map((s) => (
              <span
                key={`spr-${s.i}`}
                className="sprinkle"
                style={{
                  left: `${s.leftPct}%`,
                  "--sprinkle-size": `${s.size}px`,
                  "--sprinkle-hue": s.hue,
                  "--sprinkle-speed": `${s.speed}s`,
                  "--sprinkle-delay": `${s.delay}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Inauguration;
