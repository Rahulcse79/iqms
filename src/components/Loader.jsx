import React from "react";
import { FaJetFighterUp } from "react-icons/fa6";
import "./Loader.css";

const Loader = ({
  size = 140, // Icon size
  speed = 2.5, // Animation speed
  backgroundOpacity = 0.95,
  text = "Initializing Systems...",
}) => {
  return (
    <div
      className="loader-overlay"
      style={{ background: `rgba(240, 248, 255, ${backgroundOpacity})` }}
      role="status"
      aria-live="polite"
      aria-label="Content is loading, please wait"
    >
      <div className="jet-wrapper">
        <span className="loader"></span>
        <div className="jet-trail"></div>
      </div>
      <p className="loader-text">{text}</p>
    </div>
  );
};

export default Loader;
