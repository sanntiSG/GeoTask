'use client';

/**
 * AddressAutocomplete — search-as-you-type address input backed by Photon.
 *
 * Design notes:
 * - Debounce lives in the onChange handler (not a useEffect) to avoid the
 *   react-hooks/set-state-in-effect lint rule.
 * - An AbortController cancels in-flight requests when a new keystroke
 *   arrives before the debounce fires.
 * - A single cleanup-only useEffect disposes refs on unmount.
 * - Keyboard nav: ArrowUp / ArrowDown move activeIndex, Enter selects,
 *   Escape closes the dropdown.
 */

import { useEffect, useRef, useState } from 'react';
import { searchAddress } from '@/lib/geocode';
import type { GeocodeResult } from '@/lib/types';

interface Props {
  onSelect: (result: GeocodeResult) => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

export default function AddressAutocomplete({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Refs for debounce timer and in-flight AbortController — no re-renders needed
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);

    // Clear any pending debounce
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    // Cancel any in-flight request
    abortRef.current?.abort();

    if (value.trim().length < 3) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      searchAddress(value.trim(), controller.signal).then((data) => {
        setResults(data);
        setOpen(data.length > 0);
        setLoading(false);
      });
    }, 350);
  }

  function handleSelect(result: GeocodeResult) {
    setQuery(result.label);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(result);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleBlur() {
    // Delay closing so click on a suggestion registers first
    setTimeout(() => {
      setOpen(false);
      setActiveIndex(-1);
    }, 150);
  }

  return (
    <div className="relative">
      <label className={labelClass}>Search address</label>
      <input
        className={inputClass}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Type an address to search…"
        autoComplete="off"
      />
      {loading && (
        <p className="mt-1 text-xs text-gray-400">Searching…</p>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={i}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === activeIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onMouseDown={() => handleSelect(r)}
            >
              {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
