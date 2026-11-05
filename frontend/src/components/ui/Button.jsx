import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  'ghost-danger': 'text-slate-500 hover:text-rose-600 hover:bg-rose-50',
};

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  icon: Icon,
  className = '',
  children,
  disabled,
  ...props
}) {
  const classes = `inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const content = (
    <>
      {loading ? <Loader2 className={`${iconSize} animate-spin`} /> : Icon && <Icon className={iconSize} />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
