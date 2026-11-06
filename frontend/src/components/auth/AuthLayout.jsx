import React from 'react';
import TravelBranding from './TravelBranding';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-x-hidden">
      {/* Photo + branding */}
      <div className="w-full lg:w-[55%] flex-shrink-0 lg:sticky lg:top-0 lg:h-screen">
        <TravelBranding />
      </div>

      {/* Form */}
      <div className="relative w-full lg:w-[45%] flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16 -mt-8 lg:mt-0 rounded-t-[2rem] lg:rounded-none bg-white">
        <div
          className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full bg-orange-100/70 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative w-full max-w-md animate-rise">{children}</div>
      </div>
    </div>
  );
}
