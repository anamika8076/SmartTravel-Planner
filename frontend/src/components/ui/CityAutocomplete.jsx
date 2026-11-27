import React, { useEffect, useMemo, useState } from 'react';
import { citySuggestionsApi } from '../../api/endpoints';
import Combobox from './Combobox';

const CITY_ALIASES = new Map([
  ['bangalore', 'bengaluru'],
  ['banglore', 'bengaluru'],
]);

// After a 503 (no provider key) or 429 (rate limit), stop asking for a while
// and let the user type freely instead of flashing an error per keystroke.
const PAUSE_MS = 60_000;
let pausedUntil = 0;

export default function CityAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  options = [],
  placeholder,
  icon,
  inputClassName,
  inputRef,
  label = 'Indian city suggestions',
  ariaLabel,
  ariaInvalid,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const query = String(value || '').trim();

  useEffect(() => {
    if (query.length < 2 || Date.now() < pausedUntil) {
      setSuggestions([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await citySuggestionsApi.search(query);
        if (active) setSuggestions(result.suggestions || []);
      } catch (err) {
        if (err?.status === 503 || err?.status === 429) {
          pausedUntil = Date.now() + PAUSE_MS;
          if (active) {
            setSuggestions([]);
            setError('');
          }
        } else if (active) {
          setSuggestions([]);
          setError(err.message || 'City suggestions are temporarily unavailable.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const combinedOptions = useMemo(() => {
    const unique = new Map();
    const alias = CITY_ALIASES.get(query.toLowerCase());
    [...suggestions, ...options].map((option) => {
      const optionValue = typeof option === 'string' ? option : option.value;
      if (alias && String(optionValue).trim().toLowerCase() === alias) {
        const optionLabel = typeof option === 'string' ? option : option.label || optionValue;
        return {
          ...(typeof option === 'string' ? { value: option } : option),
          label: `${optionLabel} (${query})`,
        };
      }
      return option;
    }).forEach((option) => {
      const optionValue = typeof option === 'string' ? option : option.value;
      const optionLabel = typeof option === 'string' ? option : option.label || optionValue;
      const key = `${String(optionValue).toLowerCase()}|${String(optionLabel).toLowerCase()}`;
      if (!unique.has(key)) unique.set(key, option);
    });
    return [...unique.values()];
  }, [options, query, suggestions]);

  return (
    <>
      <Combobox
        id={id}
        ariaLabel={ariaLabel}
        ariaInvalid={ariaInvalid}
        icon={icon}
        inputRef={inputRef}
        label={loading ? 'Searching cities…' : label}
        placeholder={placeholder}
        options={combinedOptions}
        value={value}
        onChange={onChange}
        onSelect={onSelect}
        inputClassName={inputClassName}
      />
      {error && (
        <p role="status" className="mt-1 text-xs text-rose-600">
          {error} You can still enter the city manually.
        </p>
      )}
    </>
  );
}
