import React from 'react'
import { motion } from 'framer-motion'
import { Compass } from 'lucide-react'

/**
 * MapToggleButton - A premium floating map action button.
 * Adapts to light/dark themes, has pulsing/rotation animations,
 * and displays a red badge when a new party/combat action is logged.
 */
export default function MapToggleButton({ isOpen, onClick, hasAction }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 px-4 py-3 rounded-2xl font-sans font-extrabold text-xs uppercase tracking-widest text-white cursor-pointer select-none shadow-2xl border transition-all duration-300 map-toggle-btn"
      style={{
        background: isOpen
          ? 'linear-gradient(135deg, rgba(30,10,60,0.95) 0%, rgba(60,20,100,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(138,43,226,0.9) 0%, rgba(168,85,247,0.9) 100%)',
        borderColor: isOpen ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.2)',
        boxShadow: isOpen
          ? '0 8px 32px rgba(138,43,226,0.3), 0 0 0 1px rgba(168,85,247,0.3)'
          : '0 8px 32px rgba(138,43,226,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
      }}
    >
      <style>{`
        .map-toggle-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .map-icon-svg {
          animation: mapPulse 3s ease-in-out infinite alternate;
        }
        .map-needle {
          transform-origin: 12px 12px;
          animation: compassSpin 12s linear infinite;
        }
        @keyframes mapPulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 1px rgba(168,85,247,0.3)); }
          100% { transform: scale(1.04); filter: drop-shadow(0 0 5px rgba(168,85,247,0.7)); }
        }
        @keyframes compassSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (prefers-color-scheme: light) {
          .map-toggle-btn {
            background: ${isOpen 
              ? 'linear-gradient(135deg, rgba(124,58,237,0.9) 0%, rgba(109,40,217,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(109,40,217,0.85) 0%, rgba(91,33,182,0.85) 100%)'} !important;
            border-color: rgba(109,40,217,0.3) !important;
            box-shadow: 0 8px 24px rgba(109,40,217,0.2) !important;
          }
        }
      `}</style>

      {/* Action Notification Badge */}
      {hasAction && !isOpen && (
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 border border-black"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600 border-2 border-black"></span>
        </span>
      )}

      {/* Custom styled domain/tactical map SVG */}
      <svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="shrink-0 map-icon-svg"
      >
        {/* Runes/Dashed Border (Barrier) */}
        <circle cx="12" cy="12" r="10" strokeDasharray="3 3" className="opacity-75" />
        
        {/* Map Folding Grid Lines */}
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" className="opacity-40" />
        <path d="M2 12h20" className="opacity-40" />
        
        {/* Celestial Pointer Needle */}
        <polygon points="12,4 15,12 12,10 9,12" className="map-needle fill-white stroke-none" />
        <polygon points="12,20 15,12 12,10 9,12" className="map-needle fill-red-400 stroke-none" />
      </svg>

      <span className="hidden sm:inline font-sans tracking-widest font-black">
        {isOpen ? 'Ver Combate' : 'Ver Mapa'}
      </span>

      <Compass className="w-4 h-4" />
    </motion.button>
  )
}
