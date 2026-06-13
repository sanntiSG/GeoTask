import { useState, useRef, useCallback } from 'react';
import { PhotonFeature, PhotonResponse } from '../../types/index.js';
import styles from './LocationSearch.module.css';

interface LocationSearchProps {
  onSelect: (feature: PhotonFeature) => void;
  placeholder?: string;
  initialValue?: string;
}

export function LocationSearch({
  onSelect,
  placeholder = 'Buscar ubicación…',
  initialValue = '',
}: LocationSearchProps) {
  const [query, setQuery]       = useState(initialValue);
  const [results, setResults]   = useState<PhotonFeature[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout>>();
  const abortRef                = useRef<AbortController>();

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=default`;
      const res  = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) {
        setResults([]);
        setOpen(false);
        return;
      }
      const data: PhotonResponse = await res.json();
      const features = data.features ?? [];
      setResults(features);
      setOpen(features.length > 0);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSelect = (feature: PhotonFeature) => {
    const parts = [
      feature.properties.name,
      feature.properties.city,
      feature.properties.country,
    ].filter(Boolean);
    setQuery(parts.join(', '));
    setOpen(false);
    setResults([]);
    onSelect(feature);
  };

  const formatResult = (f: PhotonFeature): string => {
    const { name, city, state, country } = f.properties;
    return [name, city ?? state, country].filter(Boolean).join(', ');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputWrap}>
        <span className={styles.searchIcon}>
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={styles.input}
          autoComplete="off"
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <span className={styles.loader} />}
      </div>

      {open && results.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {results.map((feature, i) => (
            <li
              key={i}
              className={styles.option}
              onClick={() => handleSelect(feature)}
              role="option"
              aria-selected={false}
            >
              <span className={styles.optionIcon}><PinSmallIcon /></span>
              <span className={styles.optionText}>{formatResult(feature)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PinSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
    </svg>
  );
}
