import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const URL_PATTERNS = [
  /rightmove\.co\.uk/i,
  /zoopla\.co\.uk/i,
  /onthemarket\.com/i,
  /purplebricks\.co\.uk/i,
];

export default function URLPaste({ onResult, onClose }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comparison, setComparison] = useState(null);

  const isValidURL = (text) => {
    return URL_PATTERNS.some((pattern) => pattern.test(text));
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    if (!isValidURL(url)) {
      setError("Paste a link from Rightmove, Zoopla, OnTheMarket, or Purplebricks");
      return;
    }

    setLoading(true);
    setError(null);
    setComparison(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${API_URL}/api/v1/listings/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Could not analyze this listing");

      const data = await res.json();
      setComparison(data);

      if (data.postcode) {
        onResult(data.postcode);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out");
      } else if (err.message === "Failed to fetch") {
        setError("Cannot reach server");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fmtPrice = (n) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="pv-url-section">
      <div className="pv-search-wrapper">
        <span className="pv-search-icon">&#128279;</span>
        <input
          type="url"
          className="pv-search-input"
          placeholder="Paste Rightmove / Zoopla link..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoComplete="off"
        />
        <button
          className="pv-search-submit"
          disabled={loading || !url.trim()}
          onClick={handleAnalyze}
        >
          {loading ? <span className="pv-spinner" /> : "Analyze"}
        </button>
      </div>

      {error && (
        <div className="pv-error" style={{ marginTop: 12 }}>
          <span>{error}</span>
        </div>
      )}

      {comparison && (
        <div className="pv-listing-comparison pv-animate-in">
          <h3 className="pv-section-title">Listing Analysis</h3>

          {comparison.address && (
            <div className="pv-listing-address">{comparison.address}</div>
          )}

          <div className="pv-comparison">
            {comparison.asking_price && (
              <div className="pv-comparison-row">
                <span className="pv-comparison-label">Asking Price</span>
                <span className="pv-comparison-value">{fmtPrice(comparison.asking_price)}</span>
              </div>
            )}
            {comparison.last_sold_price && (
              <div className="pv-comparison-row">
                <span className="pv-comparison-label">Last Sold</span>
                <span className="pv-comparison-value">{fmtPrice(comparison.last_sold_price)}</span>
              </div>
            )}
            {comparison.area_average && (
              <div className="pv-comparison-row">
                <span className="pv-comparison-label">Area Average</span>
                <span className="pv-comparison-value">{fmtPrice(comparison.area_average)}</span>
              </div>
            )}
            {comparison.price_difference && (
              <div className="pv-comparison-row">
                <span className="pv-comparison-label">vs Last Sale</span>
                <span
                  className={`pv-comparison-value ${
                    comparison.price_difference > 0 ? "pv-change-up" : "pv-change-down"
                  }`}
                >
                  {comparison.price_difference > 0 ? "+" : ""}
                  {fmtPrice(comparison.price_difference)}
                  {comparison.price_change_percent && ` (${comparison.price_change_percent}%)`}
                </span>
              </div>
            )}
          </div>

          {comparison.overpriced && (
            <div className="pv-overpriced-alert">
              This property may be overpriced compared to recent sales in the area.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
