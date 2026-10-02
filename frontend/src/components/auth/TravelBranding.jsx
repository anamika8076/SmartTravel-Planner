import React from 'react';
import { Compass, MapPin } from 'lucide-react';

export default function TravelBranding() {
  return (
    <div
      className="relative flex flex-col justify-between w-full h-full min-h-[520px] lg:min-h-screen p-8 sm:p-12 lg:p-14 overflow-hidden text-white"
      style={{
        background:
          'linear-gradient(to bottom, #8c6b79 0%, #755165 30%, #634558 55%, #52394c 75%, #3f2638 100%)',
      }}
    >
      {/* Top-Right Soft Glowing Sun */}
      <div className="absolute -top-16 -right-16 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#d9a598]/35 pointer-events-none z-0" />

      {/* Tiny Ambient Star Dots */}
      <div className="absolute top-16 left-1/3 w-1 h-1 bg-white/40 rounded-full" />
      <div className="absolute top-28 left-16 w-1 h-1 bg-white/30 rounded-full" />
      <div className="absolute top-10 right-1/4 w-1 h-1 bg-white/50 rounded-full" />

      {/* Top Section: Brand Logo & Name */}
      <div className="relative z-10 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md ring-2 ring-white/20">
            <Compass className="w-5 h-5 text-white" />
          </div>

          <span className="font-serif text-xl font-bold tracking-wide text-white">
            Smart Travel Planner
          </span>
        </div>
      </div>

      {/* Large Left Cloud */}
      <div className="absolute top-36 left-6 sm:left-12 z-0 pointer-events-none opacity-20">
        <svg
          width="300"
          height="150"
          viewBox="0 0 240 120"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M 30 80 A 35 35 0 0 1 70 35 A 50 50 0 0 1 155 35 A 40 40 0 0 1 205 80 Z" />
        </svg>
      </div>

      {/* Right Cloud */}
      <div className="absolute top-52 right-8 sm:right-16 z-0 pointer-events-none opacity-15">
        <svg
          width="240"
          height="120"
          viewBox="0 0 200 100"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M 20 70 A 30 30 0 0 1 60 30 A 45 45 0 0 1 135 30 A 35 35 0 0 1 175 70 Z" />
        </svg>
      </div>

      {/* Center Section */}
      <div className="relative z-10 my-auto py-6 max-w-lg space-y-5">

        {/* Route Pill Badge */}
        <div>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-sm text-white font-medium shadow-sm">
            <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />

            <div className="flex items-center gap-2.5 text-xs sm:text-sm">
              <span>Delhi</span>

              <span className="text-white/60">
                →
              </span>

              <span>Manali</span>

              <span className="text-white/60">
                →
              </span>

              <span className="font-semibold text-white">
                Your next stop
              </span>
            </div>
          </div>
        </div>

        {/* Main Editorial Headline */}
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-tight">
          Plan smarter.
          <br />

          <span className="font-serif italic text-orange-400 font-medium block mt-1">
            Travel better.
          </span>
        </h1>

        {/* Supporting Subtitle */}
        <p className="text-white/85 text-base sm:text-lg font-sans max-w-md leading-relaxed font-light pt-1">
          Create personalized trips based on your time, budget and travel
          preferences.
        </p>
      </div>

      {/* Bottom Section: Mountain Waves, Cyan Path & Location Pin */}
      <div className="absolute inset-x-0 bottom-0 h-80 sm:h-96 pointer-events-none overflow-hidden z-0">

        {/* Layered Mountain Waves */}
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >

          {/* Back Mountain Layer */}
          <path
            d="M 0 220 Q 400 150 800 230 T 1440 200 L 1440 400 L 0 400 Z"
            fill="#5b4765"
            fillOpacity="0.9"
          />

          {/* Middle Mountain Layer */}
          <path
            d="M 0 270 Q 500 190 1000 280 T 1440 250 L 1440 400 L 0 400 Z"
            fill="#493451"
            fillOpacity="0.95"
          />

          {/* Foreground Mountain Layer */}
          <path
            d="M 0 320 Q 450 250 900 340 T 1440 310 L 1440 400 L 0 400 Z"
            fill="#301d38"
          />

          {/* Dashed Cyan Travel Route */}
          <path
            d="M 80 290 C 220 200, 360 270, 540 190"
            stroke="#5ba2cc"
            strokeWidth="3.5"
            strokeDasharray="8 8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Starting Waypoint */}
          <circle
            cx="80"
            cy="290"
            r="7"
            fill="#5ba2cc"
          />

          {/* Middle Waypoint */}
          <circle
            cx="388"
            cy="230"
            r="7"
            fill="#5ba2cc"
          />

          {/* Destination Waypoint */}
          <circle
            cx="540"
            cy="190"
            r="8.5"
            fill="#d97638"
          />
        </svg>

        {/* Large Orange Location Pin */}
        <div className="absolute right-[28%] bottom-4 sm:bottom-6 z-10 flex flex-col items-center pointer-events-none">
          <svg
            className="w-12 h-14 text-[#d97638] filter drop-shadow-md"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
      </div>
    </div>
  );
}