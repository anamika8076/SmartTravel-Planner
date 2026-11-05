import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ back, eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-8">
      {back && (
        <Link to={back.to} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">{eyebrow}</p>}
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight break-words">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
