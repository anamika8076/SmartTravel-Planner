import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, SearchX } from 'lucide-react';

/** Bold the part of `text` that matches `query`. */
function Highlight({ text, query }) {
  const q = query.trim().toLowerCase();
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent text-orange-600 font-semibold">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Text input with a styled suggestion dropdown (replacement for <datalist>).
 * Free text is allowed; suggestions just help. The menu is rendered in a
 * portal so it isn't clipped by rounded/overflow-hidden parents.
 */
export default function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  inputClassName = '',
  inputRef,
  label = 'Suggestions',
  ariaLabel,
  ariaInvalid,
  maxItems = 50,
}) {
  const autoId = useId();
  const listId = `${id || autoId}-list`;
  const ownRef = useRef(null);
  const ref = inputRef || ownRef;
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);

  const items = useMemo(() => {
    const q = String(value || '').trim().toLowerCase();
    // Empty, or already an exact choice → show everything so it can be changed.
    if (!q || options.some((o) => o.toLowerCase() === q)) return options.slice(0, maxItems);
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, maxItems);
  }, [value, options, maxItems]);

  const show = open;

  // Position the floating menu under (or above) the input.
  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const height = Math.min(320, 52 + items.length * 44);
    const above = spaceBelow < height + 16 && r.top > spaceBelow;
    setPos({
      left: r.left,
      width: Math.max(r.width, 300),
      top: above ? undefined : r.bottom + 8,
      bottom: above ? window.innerHeight - r.top + 8 : undefined,
    });
  };

  useLayoutEffect(() => {
    if (show) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, items.length]);

  useEffect(() => {
    if (!show) return undefined;
    const update = () => place();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Start on the current choice if there is one, else the first match.
  useEffect(() => {
    const i = items.findIndex((o) => o.toLowerCase() === String(value || '').trim().toLowerCase());
    setActive(i >= 0 ? i : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, open]);

  // Keep the highlighted option in view while using the keyboard.
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (option) => {
    onChange({ target: { value: option } });
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && show && items[active]) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab' && show && items[active] && value) {
      choose(items[active]);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />}
      <input
        ref={ref}
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && items[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`${inputClassName} pr-10`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? 'Hide suggestions' : 'Show suggestions'}
        onMouseDown={(e) => {
          e.preventDefault();
          if (show) setOpen(false);
          else {
            setOpen(true);
            ref.current?.focus();
          }
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
      >
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${show ? 'rotate-180' : ''}`} />
      </button>

      {show &&
        pos &&
        createPortal(
          <div
            style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
            className="z-[60] rounded-2xl bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/10 overflow-hidden animate-pop"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="px-4 pt-3 pb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <span className="truncate">{label}</span>
              <span className="flex-shrink-0 ml-3 whitespace-nowrap tabular-nums normal-case font-medium tracking-normal">
                {items.length} {items.length === 1 ? 'match' : 'matches'}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                <SearchX className="w-5 h-5 mx-auto mb-1.5 text-slate-300" />
                No matches — you can still type it in.
              </div>
            ) : (
              <ul ref={listRef} id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1.5">
                {items.map((option, i) => {
                  const selected = option.toLowerCase() === String(value || '').trim().toLowerCase();
                  return (
                    <li
                      key={option}
                      id={`${listId}-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(option)}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                        i === active ? 'bg-orange-50 text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">
                        <Highlight text={option} query={String(value || '')} />
                      </span>
                      {selected && <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
