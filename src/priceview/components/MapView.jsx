import { useRef, useCallback, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

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

export default function MapView({ properties, location, onSelectProperty }) {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const center = {
    latitude: location?.latitude || 51.5074,
    longitude: location?.longitude || -0.1278,
  };

  const handleMarkerClick = useCallback((property, e) => {
    e.originalEvent?.stopPropagation();
    setPopupInfo(property);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="pv-map-placeholder">
        <div style={{ textAlign: "center" }}>
          <p style={{ marginBottom: 8 }}>Map requires a Mapbox token</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>
            Set VITE_MAPBOX_TOKEN in .env
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-map-container">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          ...center,
          zoom: 15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        {properties.map((property, i) => {
          // Properties from Land Registry don't have individual lat/lng,
          // so cluster them around the postcode center with slight offsets
          const lat = property.latitude || center.latitude + (Math.random() - 0.5) * 0.002;
          const lng = property.longitude || center.longitude + (Math.random() - 0.5) * 0.002;

          return (
            <Marker
              key={property.id || i}
              latitude={lat}
              longitude={lng}
              anchor="bottom"
              onClick={(e) => handleMarkerClick({ ...property, _lat: lat, _lng: lng }, e)}
            >
              <div
                style={{
                  background: "#C9A962",
                  color: "#050505",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  fontFamily: "'Playfair Display', Georgia, serif",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(201,169,98,0.3)",
                  cursor: "pointer",
                  transform: "translateY(-4px)",
                }}
              >
                {fmtPrice(property.price)}
              </div>
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            latitude={popupInfo._lat}
            longitude={popupInfo._lng}
            anchor="bottom"
            offset={28}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
          >
            <div className="pv-map-popup">
              <div className="pv-map-popup-address">{popupInfo.address}</div>
              <div className="pv-map-popup-price">{fmtPrice(popupInfo.price).replace("£", "")}</div>
              <div className="pv-map-popup-meta">
                {fmtDate(popupInfo.transaction_date || popupInfo.date)}
                {popupInfo.property_type && ` · ${popupInfo.property_type}`}
              </div>
              <button
                onClick={() => { onSelectProperty(popupInfo); setPopupInfo(null); }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "6px",
                  background: "rgba(201,169,98,0.15)",
                  border: "1px solid #C9A962",
                  borderRadius: 6,
                  color: "#C9A962",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View details
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
