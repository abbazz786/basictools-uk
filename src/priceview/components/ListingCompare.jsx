const fmtPrice = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function ListingCompare({ listing, salesData }) {
  if (!listing || !salesData) return null;

  const askingPrice = listing.asking_price || listing.price;
  const lastSale = salesData[0];
  const lastSalePrice = lastSale?.price || 0;

  const diff = askingPrice - lastSalePrice;
  const diffPercent = lastSalePrice ? ((diff / lastSalePrice) * 100).toFixed(1) : null;

  // Compare to area average
  const areaAvg = listing.area_average || null;
  const areaDiff = areaAvg ? askingPrice - areaAvg : null;
  const areaDiffPercent = areaAvg ? ((areaDiff / areaAvg) * 100).toFixed(1) : null;

  const isOverpriced = diffPercent && parseFloat(diffPercent) > 20;

  return (
    <div className="pv-listing-comparison pv-animate-in">
      <h3 className="pv-section-title">Listing vs Reality</h3>

      <div className="pv-comparison">
        <div className="pv-comparison-row">
          <span className="pv-comparison-label">Asking Price</span>
          <span className="pv-comparison-value">{fmtPrice(askingPrice)}</span>
        </div>

        {lastSalePrice > 0 && (
          <>
            <div className="pv-comparison-row">
              <span className="pv-comparison-label">Last Sold</span>
              <span className="pv-comparison-value">{fmtPrice(lastSalePrice)}</span>
            </div>
            <div className="pv-comparison-row">
              <span className="pv-comparison-label">Difference</span>
              <span className={`pv-comparison-value ${diff >= 0 ? "pv-change-up" : "pv-change-down"}`}>
                {diff >= 0 ? "+" : ""}{fmtPrice(diff)} ({diff >= 0 ? "+" : ""}{diffPercent}%)
              </span>
            </div>
          </>
        )}

        {areaAvg && (
          <>
            <div className="pv-comparison-row">
              <span className="pv-comparison-label">Area Average</span>
              <span className="pv-comparison-value">{fmtPrice(areaAvg)}</span>
            </div>
            <div className="pv-comparison-row">
              <span className="pv-comparison-label">vs Area</span>
              <span className={`pv-comparison-value ${areaDiff >= 0 ? "pv-change-up" : "pv-change-down"}`}>
                {areaDiff >= 0 ? "+" : ""}{fmtPrice(areaDiff)} ({areaDiff >= 0 ? "+" : ""}{areaDiffPercent}%)
              </span>
            </div>
          </>
        )}
      </div>

      {isOverpriced && (
        <div className="pv-overpriced-alert">
          This listing is {diffPercent}% above the last sale price. Consider negotiating.
        </div>
      )}
    </div>
  );
}
