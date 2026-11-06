import React from 'react';
import { CalendarDays, CheckCircle2, Compass, MapPin, Mountain, Wallet } from 'lucide-react';
import { PHOTOS, sized } from '../../utils/visuals';

export default function TravelBranding() {
  return (
    <div className="relative isolate flex flex-col justify-between w-full h-full min-h-[560px] lg:min-h-screen p-8 sm:p-12 lg:p-14 overflow-hidden text-white bg-slate-900">
      {/* Background photo */}
      <img
        src={sized(PHOTOS.snowTrek, 1400, 1600)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 w-full h-full object-cover animate-kenburns"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-slate-900/30" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/60 to-transparent" aria-hidden="true" />

      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/40">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <span className="font-serif text-xl font-bold tracking-wide">Smart Travel Planner</span>
      </div>

      {/* Floating preview cards (desktop) */}
      <div className="hidden lg:block absolute right-10 top-28 w-72 animate-float">
        <div className="rounded-3xl bg-white/95 text-slate-900 p-5 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Trip estimate</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Within budget
            </span>
          </div>
          <p className="mt-3 font-serif text-2xl font-semibold">Delhi → Manali</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <CalendarDays className="w-4 h-4 text-slate-400" /> 6 days
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <Wallet className="w-4 h-4 text-slate-400" /> ₹19,140
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">96% of your ₹20,000 budget</p>
        </div>
      </div>
      <div className="hidden lg:block absolute right-28 top-[22rem] w-64 animate-float [animation-delay:1.5s]">
        <div className="rounded-2xl bg-slate-900/70 ring-1 ring-white/20 backdrop-blur-xl p-4 shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-300">Day 2</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-sky-300" /> Hadimba Devi Temple
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-300" /> Old Manali cafés
            </li>
          </ul>
        </div>
      </div>

      {/* Headline */}
      <div className="relative max-w-lg space-y-5 pt-16">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-md text-sm font-medium">
          <MapPin className="w-4 h-4 text-orange-300" />
          <span>Delhi</span>
          <span className="text-white/50">→</span>
          <span>Manali</span>
          <span className="text-white/50">→</span>
          <span className="font-semibold">Your next stop</span>
        </div>
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-shadow">
          Plan smarter.
          <span className="block italic text-orange-300">Travel better.</span>
        </h1>
        <p className="text-white/85 text-lg max-w-md leading-relaxed">
          Create personalized trips based on your time, budget and travel preferences.
        </p>
      </div>
    </div>
  );
}
