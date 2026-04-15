import PropertyCard from "./PropertyCard.jsx";

export default function Watchlist({ items, onSelect, onRemove }) {
  if (items.length === 0) {
    return (
      <div className="pv-watchlist-empty">
        <div className="pv-watchlist-empty-icon">&#9733;</div>
        <h3>No saved properties</h3>
        <p>Tap the star on any property to add it to your watchlist.</p>
      </div>
    );
  }

  return (
    <div className="pv-watchlist">
      <div className="pv-results-header">
        <span className="pv-results-count">
          {items.length} saved propert{items.length === 1 ? "y" : "ies"}
        </span>
      </div>
      <div className="pv-property-list pv-stagger">
        {items.map((property, i) => (
          <div key={i} className="pv-watchlist-item">
            <PropertyCard
              property={property}
              onClick={() => onSelect(property)}
            />
            <button
              className="pv-watchlist-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(property);
              }}
              title="Remove from watchlist"
            >
              &#10005;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
