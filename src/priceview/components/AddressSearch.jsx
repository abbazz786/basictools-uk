import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AddressSearch({ onResult, onError }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (value) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `${API_URL}/api/v1/search/address`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: value.trim() }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowDropdown(true);
        }
      } catch {
        // Silently fail — user can still type
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.address || suggestion.display);
    setShowDropdown(false);
    if (suggestion.postcode) {
      onResult(suggestion.postcode);
    }
  };

  return (
    <div ref={wrapperRef} className="pv-address-search">
      <div className="pv-search-wrapper">
        <span className="pv-search-icon">&#127968;</span>
        <input
          type="text"
          className="pv-search-input"
          placeholder="Search by address (e.g. 10 Downing Street)"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {loading && <span className="pv-spinner" style={{ marginRight: 12 }} />}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="pv-address-dropdown">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="pv-address-option"
              onClick={() => handleSelect(s)}
            >
              <span className="pv-address-option-main">{s.address || s.display}</span>
              {s.postcode && (
                <span className="pv-address-option-pc">{s.postcode}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
