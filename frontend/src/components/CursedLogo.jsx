import React from 'react';

/**
 * CursedLogo - A premium, highly stylized minimalist brand logo for "Jujutsu RPG: Céu e Terra".
 * Fits perfectly in headers, adapts automatically to light and dark themes using currentColor,
 * and adds an elegant, stylized cursed flame energy in vibrant purple/indigo.
 */
export default function CursedLogo({ className = "", size = 24, strokeWidth = 2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`cursed-brand-logo ${className}`}
      {...props}
    >
      <style>{`
        .cursed-brand-logo {
          transition: all 0.3s ease-in-out;
        }
        /* Dynamic styling for the cursed flame layer */
        .cursed-flame-path {
          stroke: #a855f7; /* Vibrant purple in dark/default */
          filter: drop-shadow(0 0 3px rgba(168, 85, 247, 0.4));
          animation: cursedFlameWobble 4s ease-in-out infinite alternate;
        }
        /* Adapt color slightly for light mode to maintain extreme readability */
        @media (prefers-color-scheme: light) {
          .cursed-flame-path {
            stroke: #7c3aed; /* Deeper purple in light mode */
            filter: drop-shadow(0 0 2px rgba(124, 58, 237, 0.2));
          }
        }
        @keyframes cursedFlameWobble {
          0% {
            stroke-dashoffset: 0;
            transform: scale(1) rotate(0deg);
          }
          100% {
            stroke-dashoffset: 3;
            transform: scale(1.02) rotate(1deg);
          }
        }
      `}</style>

      {/* Hexagonal Outer Domain Barrier (Terra / Structure) */}
      {/* Broken/Segmented design for modern high-tech feel */}
      <path 
        d="M12 2L20.5 7v4" 
        className="opacity-80"
      />
      <path 
        d="M20.5 13v4L12 22" 
        className="opacity-80"
      />
      <path 
        d="M12 22L3.5 17v-4" 
        className="opacity-80"
      />
      <path 
        d="M3.5 11V7L12 2" 
        className="opacity-80"
      />

      {/* Inner Geometric RPG d20 Facets */}
      <path 
        d="M12 7L17.5 15.5H6.5Z" 
        className="opacity-90"
        strokeWidth={strokeWidth - 0.2}
      />
      <line x1="12" y1="2" x2="12" y2="7" className="opacity-60" />
      <line x1="3.5" y1="7" x2="6.5" y2="15.5" className="opacity-60" />
      <line x1="20.5" y1="7" x2="17.5" y2="15.5" className="opacity-60" />
      <line x1="3.5" y1="17" x2="6.5" y2="15.5" className="opacity-60" />
      <line x1="20.5" y1="17" x2="17.5" y2="15.5" className="opacity-60" />
      <line x1="12" y1="22" x2="17.5" y2="15.5" className="opacity-60" />
      <line x1="12" y1="22" x2="6.5" y2="15.5" className="opacity-60" />

      {/* Intertwined Cursed Energy Flame (Yin-Yang balancing / Swirling fire) */}
      {/* Sweeps beautifully around the central faces, breaking the outer barrier */}
      <path
        d="M 5 15 C 4 10, 8 8, 12 11 C 15 13, 19 11, 18 6 C 17.5 4.5, 15.5 4, 14 5.5 C 11.5 8, 12.5 13.5, 10 16.5 C 8 19, 5.5 18, 5 15 Z"
        className="cursed-flame-path"
        strokeWidth={strokeWidth + 0.3}
        transform-origin="12 12"
      />

      {/* Cursed Spark Core (Celestial Heaven Spark) */}
      <circle cx="12" cy="12" r="1.5" className="fill-purple-400 stroke-none" />
    </svg>
  );
}
