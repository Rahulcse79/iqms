// File: Loader.jsx
// MUI-based loader with animated planes and Indian flag smoke trails

import React from "react";
import { Box, Typography, GlobalStyles } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import planeImg from "../assets/Images/loader-img.png";
import LOGO from "../assets/Images/login-logo.png";

// Animation keyframes
const cloudsBack = keyframes`
  from { background-position: 0 0; }
  to { background-position: 12000px 0; }
`;

const cloudsMid = keyframes`
  from { background-position: 0 0; }
  to { background-position: 12000px 0; }
`;

const cloudsFront = keyframes`
  from { background-position: 0 0; }
  to { background-position: 12000px 0; }
`;

const smokeDraw = keyframes`
  0% { stroke-dashoffset: 2000; opacity: 0; }
  8% { opacity: 0.22; }
  35% { opacity: 0.8; }
  80% { stroke-dashoffset: 200; opacity: 0.55; }
  100% { stroke-dashoffset: 0; opacity: 0; }
`;

const flyCenter = keyframes`
  0% { offset-distance: 0%; transform: translate(-50%, -50%) scale(0.92); }
  100% { offset-distance: 90%; transform: translate(-40%, -70%) scale(0.94); }
`;

const flyLeft = keyframes`
  0% { offset-distance: 0%; transform: translate(-50%, -50%) scale(0.92); }
  100% { offset-distance: 100%; transform: translate(-40%, -70%) scale(0.94); }
`;

const flyRight = keyframes`
  0% { offset-distance: 10%; transform: translate(-50%, -50%) scale(0.92); }
  100% { offset-distance: 100%; transform: translate(-65%, -70%) scale(0.94); }
`;

const fadePulse = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

// CSS variables for duration
const DURATION = '5s';
const EASING = 'cubic-bezier(0.22, 0.93, 0.16, 0.98)';

// Styled components
const LoaderRoot = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 9999,
  background: 'linear-gradient(180deg, #0b1a2b 0%, #1a3a5a 50%, #6fb1ff 80%)',
  opacity: 0.75,
  display: 'block',
  isolation: 'isolate',
  WebkitFontSmoothing: 'antialiased',
  transform: 'translateZ(0)',
  pointerEvents: 'all',
}));

const Sky = styled(Box)({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
});

const CloudLayer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'layer',
})(({ layer }) => ({
  position: 'absolute',
  left: '-20%',
  right: '-20%',
  top: 0,
  bottom: 0,
  backgroundRepeat: 'repeat-x',
  mixBlendMode: 'screen',
  ...(layer === 'back' && {
    backgroundImage: 'radial-gradient(closest-side, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0) 60%)',
    opacity: 0.28,
    transform: 'translateZ(0)',
    animation: `${cloudsBack} 40s linear infinite`,
  }),
  ...(layer === 'mid' && {
    backgroundImage: 'radial-gradient(closest-side, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0) 60%)',
    opacity: 0.42,
    animation: `${cloudsMid} 28s linear infinite`,
  }),
  ...(layer === 'front' && {
    backgroundImage: 'radial-gradient(closest-side, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0) 60%)',
    opacity: 0.55,
    animation: `${cloudsFront} 18s linear infinite`,
  }),
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
  },
}));

const PathsSvg = styled('svg')({
  position: 'absolute',
  left: '-10%',
  width: '120%',
  height: '100%',
  top: 0,
  pointerEvents: 'none',
  zIndex: 2,
});

const Plane = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'position',
})(({ position }) => ({
  position: 'absolute',
  top: '25%',
  left: 0,
  width: 220,
  height: 'auto',
  willChange: 'offset-distance, transform',
  zIndex: 4,
  transform: 'translate(-50%, -50%)',
  cursor: 'default',
  pointerEvents: 'none',
  filter: 'drop-shadow(0 22px 30px rgba(6,12,18,0.35))',
  '& img': {
    display: 'block',
    width: '100%',
    height: 'auto',
    transformOrigin: 'center',
  },
  ...(position === 'center' && {
    offsetPath: 'path("M -150 460 C 420 360, 940 240, 1850 80")',
    WebkitOffsetPath: 'path("M -150 460 C 420 360, 940 240, 1850 80")',
    offsetRotate: 'auto 0deg',
    WebkitOffsetRotate: 'auto 0deg',
    animation: `${flyCenter} ${DURATION} ${EASING} infinite`,
  }),
  ...(position === 'left' && {
    offsetPath: 'path("M -150 520 C 380 480, 780 410, 1700 210")',
    WebkitOffsetPath: 'path("M -150 520 C 380 480, 780 410, 1700 210")',
    offsetRotate: 'auto 0deg',
    WebkitOffsetRotate: 'auto 0deg',
    animation: `${flyLeft} ${DURATION} ${EASING} infinite`,
  }),
  ...(position === 'right' && {
    offsetPath: 'path("M -150 490 C 500 430, 1000 310, 1850 100")',
    WebkitOffsetPath: 'path("M -150 490 C 500 430, 1000 310, 1850 100")',
    offsetRotate: 'auto 0deg',
    WebkitOffsetRotate: 'auto 0deg',
    animation: `${flyRight} ${DURATION} ${EASING} infinite`,
  }),
  '@media (max-width: 880px)': {
    width: 88,
  },
  '@media (max-width: 480px)': {
    width: 64,
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
  },
}));

const Horizon = styled(Box)({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '-2%',
  height: '22%',
  background: 'linear-gradient(180deg, rgba(10,20,40,0) 0%, rgba(6,10,20,0.18) 50%, rgba(6,10,20,0.35) 100%)',
  zIndex: 1,
  pointerEvents: 'none',
});

const TextAirforce = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: 50,
  fontWeight: 800,
  textTransform: 'uppercase',
  background: 'linear-gradient(to bottom, #f78717 0%, #ffffff 50%, #138808 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
  textAlign: 'center',
  lineHeight: 1.2,
  zIndex: 100,
  textShadow: '2px 2px 6px rgba(0,0,0,0.5)',
});

const LoaderText = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  bottom: '5%',
  left: '50%',
  transform: 'translateX(-50%)',
  maxWidth: '80%',
  textAlign: 'center',
  fontSize: '1.4rem',
  fontWeight: 600,
  color: '#ffffff',
  letterSpacing: '0.5px',
  lineHeight: 1.6,
  zIndex: 200,
  padding: '12px 20px',
  borderRadius: 12,
  background: 'rgba(0,0,0,0.35)',
  backdropFilter: 'blur(4px)',
  textShadow: '0 2px 6px rgba(0,0,0,0.7)',
  animation: `${fadePulse} 2.4s ease-in-out infinite`,
  '@media (max-width: 768px)': {
    fontSize: '1.1rem',
    padding: '10px 16px',
  },
  '@media (max-width: 480px)': {
    fontSize: '0.95rem',
    padding: '8px 12px',
  },
}));

const LogoContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const LogoImage = styled('img')({
  objectFit: 'contain',
  borderRadius: 14,
  padding: 8,
  opacity: 0.4,
});

// Smoke path styles (need to be global since they're on SVG elements)
const smokeStyles = (
  <GlobalStyles
    styles={{
      '.smoke': {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none',
        strokeWidth: 25,
        opacity: 0.9,
        strokeDasharray: 2000,
        strokeDashoffset: 2000,
        filter: 'url(#smokeBlur)',
        mixBlendMode: 'screen',
        transformOrigin: '0 0',
        zIndex: 2,
      },
      '.smoke.saffron': {
        stroke: '#ff9933',
        strokeWidth: 18,
        opacity: 0.95,
        animation: `${smokeDraw} ${DURATION} linear infinite`,
      },
      '.smoke.white': {
        stroke: '#ffffff',
        strokeWidth: 18,
        opacity: 0.98,
        animation: `${smokeDraw} ${DURATION} linear infinite`,
        animationDelay: '0.06s',
      },
      '.smoke.green': {
        stroke: '#138808',
        strokeWidth: 18,
        opacity: 0.95,
        animation: `${smokeDraw} ${DURATION} linear infinite`,
        animationDelay: '0.12s',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '.smoke': {
          animation: 'none !important',
          opacity: 0.5,
        },
      },
    }}
  />
);

export default function Loader({ className = "", text = "Loading..." }) {
  return (
    <>
      {smokeStyles}
      <LoaderRoot
        className={className}
        role="status"
        aria-live="polite"
      >
        {/* Moving sky + subtle clouds */}
        <Sky>
          <CloudLayer layer="back" aria-hidden="true" />
          <CloudLayer layer="mid" aria-hidden="true" />
          <CloudLayer layer="front" aria-hidden="true" />
        </Sky>

        {/* SVG paths + smoke strokes */}
        <PathsSvg
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="smokeBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.9" />
              </feComponentTransfer>
            </filter>
          </defs>

          {/* Drawing paths for smoke */}
          <path id="p-center" d="M -120 320 C 220 300, 540 240, 1050 90" fill="none" />
          <path id="p-left" d="M -120 320 C 180 340, 420 300, 710 180" fill="none" />
          <path id="p-right" d="M -120 320 C 260 320, 700 220, 1180 60" fill="none" />

          {/* Smoke strokes (saffron, white, green) */}
          <path className="smoke saffron" d="M -120 320 C 220 300, 700 220, 1050 90" fill="none" />
          <path className="smoke white" d="M -120 320 C 280 340, 700 220, 1180 60" fill="none" />
          <path className="smoke green" d="M -120 320 C 340 380, 700 220, 1180 60" fill="none" />
        </PathsSvg>

        {/* The three planes */}
        <Plane position="center" aria-hidden="true">
          <img src={planeImg} alt="" />
        </Plane>
        <Plane position="left" aria-hidden="true">
          <img src={planeImg} alt="" />
        </Plane>
        <Plane position="right" aria-hidden="true">
          <img src={planeImg} alt="" />
        </Plane>

        {/* Horizon for depth */}
        <Horizon aria-hidden="true" />

        {/* Logo */}
        <LogoContainer>
          <LogoImage src={LOGO} alt="AFCAO LOGO" />
        </LogoContainer>

        {/* Title text */}
        <TextAirforce>
          <div>AIR FORCE CENTRAL ACCOUNTS OFFICE</div>
          <pre>(AFCAO)</pre>
        </TextAirforce>

        {/* Dynamic Loader Text */}
        <LoaderText>{text}</LoaderText>
      </LoaderRoot>
    </>
  );
}
