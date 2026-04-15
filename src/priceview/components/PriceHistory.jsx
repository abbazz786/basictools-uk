const fmtPrice = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

export default function PriceHistory({ history }) {
  if (!history || history.length < 2) return null;

  const sorted = [...history].sort(
    (a, b) => new Date(a.date || a.transaction_date) - new Date(b.date || b.transaction_date)
  );

  const prices = sorted.map((h) => h.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;

  // Calculate overall change
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const totalChange = lastPrice - firstPrice;
  const totalChangePercent = ((totalChange / firstPrice) * 100).toFixed(1);

  return (
    <div className="pv-history-section">
      <h3 className="pv-section-title">Price History</h3>

      {/* Summary */}
      <div className="pv-history-summary">
        <span className={totalChange >= 0 ? "pv-change-up" : "pv-change-down"}>
          {totalChange >= 0 ? "+" : ""}{fmtPrice(totalChange)} ({totalChange >= 0 ? "+" : ""}{totalChangePercent}%)
        </span>
        <span className="pv-history-period">
          since {fmtDate(sorted[0].date || sorted[0].transaction_date)}
        </span>
      </div>

      {/* Visual bar chart */}
      <div className="pv-history-chart">
        {sorted.map((entry, i) => {
          const height = ((entry.price - minPrice) / range) * 80 + 20;
          const isLast = i === sorted.length - 1;

          return (
            <div key={i} className="pv-history-bar-wrap">
              <div className="pv-history-bar-label">{fmtPrice(entry.price)}</div>
              <div
                className={`pv-history-bar ${isLast ? "pv-history-bar-current" : ""}`}
                style={{ height: `${height}%` }}
              />
              <div className="pv-history-bar-date">
                {fmtDate(entry.date || entry.transaction_date)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table fallback */}
      <div className="pv-comparison">
        {sorted.map((entry, i) => (
          <div key={i} className="pv-comparison-row">
            <span className="pv-comparison-label">
              {fmtDate(entry.date || entry.transaction_date)}
              {entry.price_type && ` (${entry.price_type})`}
            </span>
            <span className="pv-comparison-value">{fmtPrice(entry.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
