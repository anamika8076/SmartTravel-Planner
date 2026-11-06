import React from 'react';

/** Horizontal filter chips. items: [{ key, label, count }] */
export default function Pills({ items, value, onChange, tone = 'light' }) {
  return (
    <div role="tablist" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
      {items.map((item) => {
        const active = item.key === value;
        const base = 'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all';
        const styles =
          tone === 'dark'
            ? active
              ? 'bg-white text-slate-900 shadow-sm'
              : 'bg-white/10 text-white/85 hover:bg-white/20 ring-1 ring-inset ring-white/20'
            : active
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white ring-1 ring-inset ring-slate-200 text-slate-600 hover:ring-orange-300 hover:text-slate-900';
        const countStyle = active ? (tone === 'dark' ? 'text-orange-400' : 'text-white/60') : tone === 'dark' ? 'text-white/50' : 'text-slate-400';
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`${base} ${styles}`}
          >
            {item.label}
            {item.count != null && <span className={`ml-1.5 tabular-nums ${countStyle}`}>{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
