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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function FlatBreakdown({ flats, buildingAddress }) {
  if (!flats || flats.length < 2) return null;

  const prices = flats.map((f) => f.price).filter(Boolean);
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const minFlat = flats.reduce((min, f) => (f.price < min.price ? f : min), flats[0]);
  const maxFlat = flats.reduce((max, f) => (f.price > max.price ? f : max), flats[0]);

  return (
    <div className="pv-flat-breakdown">
      <h3 className="pv-section-title">Flats in this Building</h3>

      {buildingAddress && (
        <div className="pv-flat-building-name">{buildingAddress}</div>
      )}

      {/* Summary stats */}
      <div className="pv-stats" style={{ marginBottom: 16 }}>
        <div className="pv-stat">
          <div className="pv-stat-label">units</div>
          <div className="pv-stat-value">{flats.length}</div>
        </div>
        <div className="pv-stat">
          <div className="pv-stat-label">avg price</div>
          <div className="pv-stat-value" style={{ fontSize: 13 }}>{fmtPrice(avgPrice)}</div>
        </div>
        <div className="pv-stat">
          <div className="pv-stat-label">range</div>
          <div className="pv-stat-value" style={{ fontSize: 13 }}>
            {fmtPrice(minFlat.price)} - {fmtPrice(maxFlat.price)}
          </div>
        </div>
      </div>

      {/* Individual flats */}
      <div className="pv-comparison">
        {flats.map((flat, i) => (
          <div key={i} className="pv-comparison-row">
            <div>
              <span className="pv-comparison-label">
                {flat.unit || flat.address || `Flat ${i + 1}`}
              </span>
              {flat.transaction_date && (
                <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>
                  Sold {fmtDate(flat.transaction_date)}
                </div>
              )}
            </div>
            <span className="pv-comparison-value">{fmtPrice(flat.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
