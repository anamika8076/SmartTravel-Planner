import React from 'react';
import TravelBranding from './TravelBranding';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-900 overflow-x-hidden">
      {/* Left Branding / Travel Illustration Section (50% Width on Desktop) */}
      <div className="w-full lg:w-1/2 flex-shrink-0">
        <TravelBranding />
      </div>

      {/* Right Form Section (50% Width on Desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-slate-50 bg-dotted-pattern relative min-h-screen lg:min-h-0">
        <div className="w-full max-w-md my-auto py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
