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
  D: "Detached",
  S: "Semi-detached",
  T: "Terraced",
  F: "Flat",
  O: "Other",
  detached: "Detached",
  "semi-detached": "Semi-detached",
  terraced: "Terraced",
  flat: "Flat",
};

const TENURE_LABELS = {
  F: "Freehold",
  L: "Leasehold",
  freehold: "Freehold",
  leasehold: "Leasehold",
};

export default function PropertyCard({ property, onClick }) {
  const {
    address,
    address_line_1,
    address_line_2,
    city,
    postcode,
    price,
    transaction_date,
    date,
    property_type,
    tenure,
    new_build,
  } = property;

  const displayAddress = address || [address_line_1, address_line_2].filter(Boolean).join(", ");
  const displayCity = city || "";
  const displayDate = fmtDate(transaction_date || date);
  const typeLabel = TYPE_LABELS[property_type] || property_type || "";
  const tenureLabel = TENURE_LABELS[tenure] || tenure || "";

  return (
    <div className="pv-property-item pv-animate-in" onClick={onClick}>
      <div className="pv-property-info">
        <div className="pv-property-address">{displayAddress}</div>
        <div className="pv-property-meta">
          {displayCity && <span>{displayCity}</span>}
          {typeLabel && <span> &middot; {typeLabel}</span>}
          {tenureLabel && <span> &middot; {tenureLabel}</span>}
          {new_build && <span> &middot; New build</span>}
        </div>
        {displayDate && <div className="pv-property-date">Sold {displayDate}</div>}
      </div>
      <div className="pv-property-price">{fmtPrice(price)}</div>
    </div>
  );
}
