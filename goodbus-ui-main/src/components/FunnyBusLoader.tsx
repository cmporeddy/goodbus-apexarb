import React, { useState, useEffect } from 'react';

interface FunnyBusLoaderProps {
  sourceCity?: string;
  destinationCity?: string;
}

const FUNNY_BUS_QUOTES = [
  'Honking horn in 18 distinct musical tones to clear the highway... 📯',
  'Negotiating with conductor for that sweet front window seat... 🪟',
  'Politely asking uncle in seat 14 to turn down his reel volume... 🎧',
  'Stopping at highway dhaba for piping hot adrak chai & samosas... ☕🥟',
  'Testing if the sleeper berth charging socket actually has electricity... ⚡',
  'Flashing high beams to swiftly overtake slow lorries on the bypass... 🚛💨',
  'Waking up the cleaner to hoist heavy suitcases onto the roof rack... 🧳',
  'Syncing live satellite GPS with driver’s legendary sixth sense... 🛰️🧭',
  'Rolling down heavy velvet curtains so morning sun doesn’t interrupt sleep... 🌅',
  'Double-checking if AC temperature is set to freezing arctic mode... ❄️',
  'Calculating the fastest shortcut through toll plazas with active FASTag... 🛣️'
];

export const FunnyBusLoader: React.FC<FunnyBusLoaderProps> = ({
  sourceCity = 'Source',
  destinationCity = 'Destination'
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % FUNNY_BUS_QUOTES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-sm text-center overflow-hidden relative">
      {/* Background Decorative Ambient Radial Glow */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Bus Animation Canvas */}
      <div className="relative max-w-sm mx-auto mb-6 py-4">
        {/* Animated Bus Graphics Container */}
        <div className="relative inline-block animate-bounce [animation-duration:1.4s]">
          {/* Exhaust Smoke Puffs */}
          <div className="absolute -left-6 bottom-3 flex items-center gap-1 opacity-75">
            <span className="w-2.5 h-2.5 bg-gray-300 rounded-full animate-ping [animation-duration:1s]" />
            <span className="w-2 h-2 bg-gray-200 rounded-full animate-ping [animation-duration:1.3s] [animation-delay:0.3s]" />
          </div>

          {/* SVG Custom Indian Multi-Axle Bus */}
          <svg
            className="w-56 sm:w-64 h-auto drop-shadow-md"
            viewBox="0 0 280 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bus Shadow */}
            <ellipse cx="140" cy="115" rx="125" ry="5" fill="#e5e7eb" />

            {/* Bus Main Chassis Body */}
            <path
              d="M15 88 L15 32 C15 22 23 15 35 15 L235 15 C258 15 268 28 272 50 L275 80 C276 86 272 88 265 88 Z"
              fill="#d84e55"
            />

            {/* Roof Aerodynamic AC Cowling */}
            <rect x="70" y="8" width="130" height="9" rx="4" fill="#b9383f" />
            <rect x="85" y="10" width="100" height="4" rx="2" fill="#ffffff" opacity="0.4" />

            {/* Front Windshield Glass */}
            <path
              d="M232 20 L250 20 C262 25 268 36 270 54 L232 54 Z"
              fill="#1e293b"
            />
            {/* Windshield Reflection */}
            <path d="M242 22 L248 22 L240 50 L234 50 Z" fill="#ffffff" opacity="0.35" />

            {/* Driver Silhouette & Steering Wheel */}
            <circle cx="248" cy="40" r="4.5" fill="#94a3b8" />
            <path d="M255 48 C255 44 250 44 250 48" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

            {/* Upper Deck Sleeper Berths Windows */}
            <rect x="30" y="24" width="28" height="15" rx="3" fill="#0f172a" />
            <rect x="64" y="24" width="28" height="15" rx="3" fill="#0f172a" />
            <rect x="98" y="24" width="28" height="15" rx="3" fill="#0f172a" />
            <rect x="132" y="24" width="28" height="15" rx="3" fill="#0f172a" />
            <rect x="166" y="24" width="28" height="15" rx="3" fill="#0f172a" />
            <rect x="200" y="24" width="26" height="15" rx="3" fill="#0f172a" />

            {/* Upper Window Curtains / Passenger Light */}
            <rect x="32" y="26" width="12" height="11" rx="2" fill="#fbbf24" opacity="0.6" />
            <rect x="100" y="26" width="10" height="11" rx="2" fill="#60a5fa" opacity="0.5" />
            <rect x="168" y="26" width="12" height="11" rx="2" fill="#fbbf24" opacity="0.7" />

            {/* Lower Deck Windows */}
            <rect x="30" y="44" width="28" height="18" rx="3" fill="#0f172a" />
            <rect x="64" y="44" width="28" height="18" rx="3" fill="#0f172a" />
            <rect x="98" y="44" width="28" height="18" rx="3" fill="#0f172a" />
            <rect x="132" y="44" width="28" height="18" rx="3" fill="#0f172a" />
            <rect x="166" y="44" width="28" height="18" rx="3" fill="#0f172a" />
            <rect x="200" y="44" width="26" height="18" rx="3" fill="#0f172a" />

            {/* Lower Window Ambient Lights */}
            <rect x="66" y="46" width="14" height="14" rx="2" fill="#fde047" opacity="0.5" />
            <rect x="134" y="46" width="14" height="14" rx="2" fill="#38bdf8" opacity="0.4" />

            {/* Sleek Golden / White Speed Livery Stripe */}
            <path d="M15 68 Q 130 64 274 68 L274 74 Q 130 70 15 74 Z" fill="#ffffff" opacity="0.9" />
            <path d="M15 76 Q 130 73 273 77 L272 79 Q 130 75 15 79 Z" fill="#fbbf24" />

            {/* GoodBus Brand Logo Badge on Bus Body */}
            <text x="100" y="84" fill="#ffffff" fontSize="8" fontWeight="bold" letterSpacing="1">
              GOODBUS EXPRESS
            </text>

            {/* Front Headlight Beam */}
            <polygon points="274,78 280,74 280,84" fill="#fef08a" />
            <circle cx="272" cy="79" r="4" fill="#fef08a" />

            {/* Tail Red Reflector */}
            <rect x="15" y="74" width="3" height="10" rx="1" fill="#ef4444" />

            {/* Wheel Arches */}
            <circle cx="58" cy="94" r="18" fill="#111827" />
            <circle cx="198" cy="94" r="18" fill="#111827" />
            <circle cx="236" cy="94" r="18" fill="#111827" />

            {/* Wheels - Rotating Tyres */}
            <g className="animate-spin [animation-duration:0.8s] origin-[58px_94px]">
              <circle cx="58" cy="94" r="15" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
              <circle cx="58" cy="94" r="7" fill="#9ca3af" />
              <line x1="58" y1="82" x2="58" y2="106" stroke="#4b5563" strokeWidth="2" />
              <line x1="46" y1="94" x2="70" y2="94" stroke="#4b5563" strokeWidth="2" />
            </g>

            <g className="animate-spin [animation-duration:0.8s] origin-[198px_94px]">
              <circle cx="198" cy="94" r="15" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
              <circle cx="198" cy="94" r="7" fill="#9ca3af" />
              <line x1="198" y1="82" x2="198" y2="106" stroke="#4b5563" strokeWidth="2" />
              <line x1="186" y1="94" x2="210" y2="94" stroke="#4b5563" strokeWidth="2" />
            </g>

            <g className="animate-spin [animation-duration:0.8s] origin-[236px_94px]">
              <circle cx="236" cy="94" r="15" fill="#1f2937" stroke="#4b5563" strokeWidth="2" />
              <circle cx="236" cy="94" r="7" fill="#9ca3af" />
              <line x1="236" y1="82" x2="236" y2="106" stroke="#4b5563" strokeWidth="2" />
              <line x1="224" y1="94" x2="248" y2="94" stroke="#4b5563" strokeWidth="2" />
            </g>
          </svg>
        </div>

        {/* Highway Asphalt Road with Moving Yellow Dashes */}
        <div className="h-3 w-64 sm:w-80 mx-auto bg-gray-800 rounded-full overflow-hidden relative shadow-inner mt-1">
          <div
            className="absolute inset-0 flex items-center justify-around animate-pulse"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #facc15 0, #facc15 14px, transparent 14px, transparent 28px)',
              backgroundSize: '28px 100%'
            }}
          />
        </div>
      </div>

      {/* Dynamic Route Info */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-gray-800 mb-2">
        <span className="text-gray-900">{sourceCity}</span>
        <span className="material-symbols-outlined text-[#d84e55] text-[18px]">
          trending_flat
        </span>
        <span className="text-gray-900">{destinationCity}</span>
      </div>

      {/* Rotating Funny Travel Quote Badge */}
      <div className="max-w-md mx-auto min-h-[56px] flex items-center justify-center">
        <div
          key={quoteIndex}
          className="bg-red-50/90 text-gray-800 border border-red-200/80 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {FUNNY_BUS_QUOTES[quoteIndex]}
        </div>
      </div>

      {/* Subtext info */}
      <p className="text-[11px] text-gray-400 mt-4 font-normal">
        Connecting directly with live fleet servers for best live seats &amp; fares...
      </p>

      {/* Shimmering Progress Bar */}
      <div className="w-48 sm:w-64 h-1.5 bg-gray-100 rounded-full mx-auto mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#d84e55] via-amber-400 to-[#d84e55] rounded-full animate-pulse" />
      </div>
    </div>
  );
};
