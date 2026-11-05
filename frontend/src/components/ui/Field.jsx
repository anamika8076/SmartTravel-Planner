import React from 'react';

const base =
  'w-full rounded-xl border bg-white py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2';
const ok = 'border-slate-200 hover:border-slate-300 focus:border-slate-800 focus:ring-slate-900/10';
const bad = 'border-rose-300 focus:border-rose-500 focus:ring-rose-200';

function Wrapper({ id, label, hint, error, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      ) : (
        hint && <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

export function TextField({ id, label, hint, error, icon: Icon, className, ...props }) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <input
          id={id}
          name={id}
          aria-invalid={!!error}
          className={`${base} ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 ${error ? bad : ok}`}
          {...props}
        />
      </div>
    </Wrapper>
  );
}

export function SelectField({ id, label, hint, error, options, placeholder, className, ...props }) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        name={id}
        aria-invalid={!!error}
        className={`${base} px-3.5 ${error ? bad : ok}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}
