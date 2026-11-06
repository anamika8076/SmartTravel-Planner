import React from 'react';
import Photo from './Photo';

/**
 * Full-bleed photo banner used at the top of app pages.
 * Pass `name` (a place) or `src` (a photo URL) to choose the image.
 */
export default function Hero({ name, extra, src, className = '', children, minHeight = 'min-h-[20rem] sm:min-h-[24rem]' }) {
  return (
    <section
      className={`relative isolate overflow-hidden rounded-[2rem] text-white shadow-2xl shadow-slate-900/20 ring-1 ring-black/5 ${minHeight} flex flex-col ${className}`}
    >
      <Photo name={name} extra={extra} src={src} width={1600} height={700} eager imgClassName="animate-kenburns" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" aria-hidden="true" />
      <div className="relative flex-1 flex flex-col p-6 sm:p-10 lg:p-12">{children}</div>
    </section>
  );
}
