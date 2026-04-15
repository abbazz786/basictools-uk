import PriceHistory from "./PriceHistory.jsx";
import FlatBreakdown from "./FlatBreakdown.jsx";

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

const TYPE_LABELS = {
  D: "Detached", S: "Semi-detached", T: "Terraced", F: "Flat", O: "Other",
  detached: "Detached", "semi-detached": "Semi-detached", terraced: "Terraced", flat: "Flat",
};

const TENURE_LABELS = {
  F: "Freehold", L: "Leasehold", freehold: "Freehold", leasehold: "Leasehold",
};

export default function PropertyDetail({ property, allResults = [], isWatched, onToggleWatch, onClose }) {
  const {
    address, address_line_1, address_line_2, city, postcode,
    price, transaction_date, date, property_type, tenure, new_build,
    price_history,
  } = property;

  const displayAddress = address || [address_line_1, address_line_2].filter(Boolean).join(", ");

  // Build price history from allResults (all sales at this address)
  const addressKey = displayAddress?.toLowerCase().trim();
  const salesAtAddress = allResults.filter((r) => {
    const rAddr = (r.address || [r.address_line_1, r.address_line_2].filter(Boolean).join(", "))
      ?.toLowerCase().trim();
    return rAddr === addressKey;
  });

  const historyData = price_history && price_history.length > 1
    ? price_history
    : salesAtAddress.length > 1
    ? salesAtAddress.map((s) => ({
        price: s.price,
        date: s.transaction_date || s.date,
        price_type: s.property_type,
      }))
    : null;

  // Detect flats in same building (for flat breakdown)
  const isFlat = property_type === "F" || property_type === "flat";
  const flatsInBuilding = isFlat && postcode
    ? allResults.filter((r) => r.postcode === postcode && (r.property_type === "F" || r.property_type === "flat"))
    : [];

  return (
    <>
      <div className="pv-sheet-backdrop" onClick={onClose} />
      <div className="pv-sheet open">
        <div className="pv-sheet-handle" />

        <div className="pv-detail-header">
          <div className="pv-detail-header-row">
            <div>
              <h2 className="pv-detail-address">{displayAddress}</h2>
              {city && <p className="pv-detail-city">{city}{postcode ? `, ${postcode}` : ""}</p>}
            </div>
            {onToggleWatch && (
              <button
                className={`pv-watch-btn ${isWatched ? "pv-watched" : ""}`}
                onClick={onToggleWatch}
                title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
              >
                {isWatched ? "★" : "☆"}
              </button>
            )}
          </div>
        </div>

        <div className="pv-detail-price-section">
          <div className="pv-price pv-price-large">{fmtPrice(price).replace("£", "")}</div>
          <div className="pv-detail-date">
            {fmtDate(transaction_date || date) ? `Sold ${fmtDate(transaction_date || date)}` : ""}
          </div>
        </div>

        <div className="pv-stats">
          {property_type && (
            <div className="pv-stat">
              <div className="pv-stat-label">type</div>
              <div className="pv-stat-value">{TYPE_LABELS[property_type] || property_type}</div>
            </div>
          )}
          {tenure && (
            <div className="pv-stat">
              <div className="pv-stat-label">tenure</div>
              <div className="pv-stat-value">{TENURE_LABELS[tenure] || tenure}</div>
            </div>
          )}
          {new_build && (
            <div className="pv-stat">
              <div className="pv-stat-label">status</div>
              <div className="pv-stat-value">New Build</div>
            </div>
          )}
        </div>

        {/* Price History chart */}
        <PriceHistory history={historyData} />

        {/* Flat breakdown for multi-unit buildings */}
        <FlatBreakdown
          flats={flatsInBuilding}
          buildingAddress={postcode}
        />

        <button className="pv-detail-close" onClick={onClose}>Close</button>
      </div>
    </>
  );
}
