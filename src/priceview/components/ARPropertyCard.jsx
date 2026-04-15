const fmtPrice = (n) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export default function ARPropertyCard({ property, style, onClick }) {
  const { address, price, distance, property_type } = property;

  // Scale card size based on distance (closer = larger)
  const scale = distance ? Math.max(0.6, Math.min(1.2, 100 / distance)) : 1;

  return (
    <div
      className="pv-ar-card"
      style={{
        ...style,
        transform: `translateX(-50%) scale(${scale})`,
      }}
      onClick={onClick}
    >
      <div className="pv-ar-card-price">{fmtPrice(price)}</div>
      <div className="pv-ar-card-address">{address}</div>
      {distance && (
        <div className="pv-ar-card-distance">
          {distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`}
        </div>
      )}
    </div>
  );
}
