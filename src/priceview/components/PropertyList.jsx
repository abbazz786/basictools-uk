import PropertyCard from "./PropertyCard.jsx";

export default function PropertyList({ results, loading, onSelect }) {
  if (loading) {
    return (
      <div className="pv-property-list pv-stagger">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="pv-property-item pv-skeleton">
            <div>
              <div className="pv-skeleton-line" style={{ width: "70%", marginBottom: 8 }} />
              <div className="pv-skeleton-line" style={{ width: "50%" }} />
            </div>
            <div className="pv-skeleton-line" style={{ width: "80px", height: 28 }} />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="pv-results-header-wrap">
      <div className="pv-results-header">
        <span className="pv-results-count">{results.length} propert{results.length === 1 ? "y" : "ies"} found</span>
      </div>
      <div className="pv-property-list pv-stagger">
        {results.map((property, i) => (
          <PropertyCard
            key={property.id || i}
            property={property}
            onClick={() => onSelect(property)}
          />
        ))}
      </div>
    </div>
  );
}
