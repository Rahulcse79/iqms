import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Inauguration.css";

// Make sure these files exist
import logo1 from "../assets/Images/login-logo1.png";
import logo2 from "../assets/Images/login-logo.png";

const Inauguration = ({
  duration = 2400,
  showConfetti = false,
  onComplete,
  className,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLogos, setShowLogos] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0); // 0 = none, 1 = logo1, 2 = logo2
  const [showContent, setShowContent] = useState(false);

  const rootRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const timersRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const handleReveal = () => {
    if (isAnimating || isRevealed) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setIsAnimating(true);

    if (prefersReducedMotion) {
      setIsRevealed(true);
      setShowContent(true);
      setIsAnimating(false);
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    setIsRevealed(true);

    const curtainOpenTime = Math.max(600, Math.round(duration * 0.7));
    const logoVisibleMs = 1600;
    const gapBetweenLogos = 300;
    const endDelay = 200;

    const t0 = setTimeout(() => {
      setShowLogos(true);
      setLogoIndex(1);

      // switch to second logo
      const t1 = setTimeout(() => {
        setLogoIndex(2);
      }, logoVisibleMs + gapBetweenLogos);
      timersRef.current.push(t1);

      // finish and show content
      const totalLogoTime = logoVisibleMs * 2 + gapBetweenLogos * 2 + endDelay;
      const t2 = setTimeout(() => {
        setShowLogos(false);
        setLogoIndex(0);
        setShowContent(true);
        setIsAnimating(false);
        if (onCompleteRef.current) onCompleteRef.current();
      }, totalLogoTime);
      timersRef.current.push(t2);
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
            <div className="ribbon-label ribbon-label-left">Welcome to the</div>

            {/* Bow in the center */}
            <div className="ribbon-bow" aria-hidden="true">
              <svg
                viewBox="0 0 200 120"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="bowGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="55%" stopColor="#ffeca8" />
                    <stop offset="100%" stopColor="#b8872a" />
                  </linearGradient>

                  <linearGradient id="knotGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#b8872a" />
                    <stop offset="100%" stopColor="#ffd98a" />
                  </linearGradient>

                  <filter
                    id="bowShadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="8"
                      stdDeviation="8"
                      floodColor="#000"
                      floodOpacity="0.32"
                    />
                  </filter>
                </defs>

                <path
                  d="M40 55 C10 10, 90 6, 70 60 C62 86, 26 96, 40 55 Z"
                  fill="url(#bowGrad)"
                  filter="url(#bowShadow)"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1"
                />
                <path
                  d="M160 55 C190 10, 110 6, 130 60 C138 86, 174 96, 160 55 Z"
                  fill="url(#bowGrad)"
                  filter="url(#bowShadow)"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1"
                />
                <path
                  d="M78 72 C72 86, 66 100, 74 112 C62 108, 56 96, 78 72 Z"
                  fill="url(#bowGrad)"
                  opacity="0.98"
                />
                <path
                  d="M122 72 C128 86, 134 100, 126 112 C138 108, 144 96, 122 72 Z"
                  fill="url(#bowGrad)"
                  opacity="0.98"
                />
                <ellipse
                  cx="100"
                  cy="60"
                  rx="22"
                  ry="14"
                  fill="url(#knotGrad)"
                  stroke="rgba(0,0,0,0.12)"
                  strokeWidth="1"
                />
                <path
                  d="M60 44 C74 42, 86 46, 100 48"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M140 44 C126 42, 114 46, 100 48"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <ellipse
                  cx="96"
                  cy="56"
                  rx="6.5"
                  ry="3.6"
                  fill="rgba(255,255,255,0.28)"
                  transform="rotate(-12 96 56)"
                />
              </svg>
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
