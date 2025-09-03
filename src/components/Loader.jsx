// File: Loader.jsx
// Place this file at: src/components/Loader/Loader.jsx
// Make sure you have the image at: ../assets/Images/loader-image.png (relative to this file)

import React from "react";
import "./Loader.css";
import planeImg from "../assets/Images/loader-img.png";

export default function Loader({ className = "", text = "Loading..." }) {
  return (
    <div
      className={`rafale-loader ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* moving sky + subtle clouds */}
      <div className="sky">
        <div className="cloud-layer layer-back" aria-hidden></div>
        <div className="cloud-layer layer-mid" aria-hidden></div>
        <div className="cloud-layer layer-front" aria-hidden></div>
      </div>

      {/* SVG paths + smoke strokes. These are visual helpers; the actual planes are animated via CSS motion-path */}
      <svg
        className="paths-svg"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id="smokeBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.9" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Drawing paths for smoke (these match CSS motion paths below) */}
        <path
          id="p-center"
          d="M -120 320 C 220 300, 540 240, 1050 90"
          fill="none"
        />
        <path
          id="p-left"
          d="M -120 320 C 180 340, 420 300, 710 180"
          fill="none"
        />
        <path
          id="p-right"
          d="M -120 320 C 260 320, 700 220, 1180 60"
          fill="none"
        />

        {/* Smoke strokes (saffron, white, green). The stroke animation is synchronized with the planes. */}
        <path
          className="smoke saffron"
          d="M -120 320 C 220 300, 540 240, 1050 90"
          fill="none"
          filter="url(#smokeBlur)"
        />
        <path
          className="smoke white"
          d="M -120 320 C 180 340, 420 300, 710 180"
          fill="none"
          filter="url(#smokeBlur)"
        />
        <path
          className="smoke green"
          d="M -120 320 C 260 320, 700 220, 1180 60"
          fill="none"
          filter="url(#smokeBlur)"
        />
      </svg>

      {/* The three planes (images) that follow their respective motion paths */}
      <div className="plane plane-center" aria-hidden>
        <img src={planeImg} alt="" />
      </div>

      <div className="plane plane-left" aria-hidden>
        <img src={planeImg} alt="" />
      </div>

      <div className="plane plane-right" aria-hidden>
        <img src={planeImg} alt="" />
      </div>

      {/* subtle ground blur to give depth */}
      <div className="horizon" aria-hidden />
      <div className="text-airfoce">
        <div>AFCAO</div>
        <div>INDIAN AIR FORCE</div>
      </div>

      {/* Dynamic Loader Text */}
      <div className="loader-text">{text}</div>
    </div>
  );
}
