import { useState } from "react";

const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export default function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && POSTCODE_RE.test(value.trim())) {
      onSearch(value.trim());
    }
  };

  const formatPostcode = (raw) => {
    const clean = raw.replace(/\s+/g, "").toUpperCase();
    if (clean.length > 3) {
      return clean.slice(0, -3) + " " + clean.slice(-3);
    }
    return raw;
  };

  return (
    <form className="pv-search-form" onSubmit={handleSubmit}>
      <div className="pv-search-wrapper">
        <span className="pv-search-icon">&#128269;</span>
        <input
          type="text"
          className="pv-search-input"
          placeholder="Enter postcode (e.g. SW1A 1AA)"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onBlur={() => setValue(formatPostcode(value))}
          maxLength={8}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <button
          type="submit"
          className="pv-search-submit"
          disabled={loading || !POSTCODE_RE.test(value.trim())}
        >
          {loading ? (
            <span className="pv-spinner" />
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}
