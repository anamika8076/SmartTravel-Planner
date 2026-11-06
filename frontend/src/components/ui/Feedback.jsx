import React from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

const ALERT_STYLES = {
  error: { box: 'bg-rose-50 border-rose-200 text-rose-800', icon: AlertCircle, iconColor: 'text-rose-500' },
  success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2, iconColor: 'text-emerald-600' },
  info: { box: 'bg-sky-50 border-sky-200 text-sky-800', icon: Info, iconColor: 'text-sky-500' },
};

export function Alert({ type = 'error', children, action }) {
  if (!children) return null;
  const s = ALERT_STYLES[type];
  const Icon = s.icon;
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`p-3.5 rounded-xl border text-sm flex items-start gap-2.5 ${s.box}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${s.iconColor}`} />
      <div className="flex-1 min-w-0 break-words">{children}</div>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
      <Loader2 className="w-5 h-5 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="text-center py-14 px-6 bg-white/80 border border-dashed border-orange-200 rounded-2xl animate-rise">
      {Icon && (
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-100 flex items-center justify-center text-orange-700 rotate-3">
          <Icon className="w-7 h-7 -rotate-3" />
        </div>
      )}
      <h3 className="font-serif text-xl font-semibold text-slate-900">{title}</h3>
      {children && <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Card({ className = '', children }) {
  return <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm shadow-slate-900/[0.03] ${className}`}>{children}</div>;
}

export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    plum: 'bg-orange-50 text-slate-800 ring-1 ring-orange-200',
    white: 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur',
    teal: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    sky: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}
