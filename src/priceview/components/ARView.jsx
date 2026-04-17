import { useEffect, useState, useRef, useCallback } from "react";
import useCamera from "../hooks/useCamera.js";
import useGeolocation from "../hooks/useGeolocation.js";
import useDeviceOrientation from "../hooks/useDeviceOrientation.js";
import ARPropertyCard from "./ARPropertyCard.jsx";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const FOV = 90; // Field of view in degrees (wider than typical to show more cards)

/**
 * Calculate bearing from point A to point B (in degrees, 0 = North)
 */
function getBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Calculate distance between two points in meters (Haversine)
 */
function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate screen X position for a building given user heading and FOV
 */
function getScreenX(buildingBearing, userHeading, screenWidth) {
  let diff = buildingBearing - userHeading;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  const halfFov = FOV / 2;
  if (Math.abs(diff) > halfFov) return null; // Not in view

  return ((diff + halfFov) / FOV) * screenWidth;
}

export default function ARView({ onSelectProperty, onBack }) {
  const camera = useCamera();
  const geo = useGeolocation();
  const orientation = useDeviceOrientation();
  const containerRef = useRef(null);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [started, setStarted] = useState(false);

  // Start all sensors
  const startAR = useCallback(async () => {
    await camera.start();
    geo.start();
    await orientation.requestPermission();
    setStarted(true);
  }, [camera, geo, orientation]);

  // Stop all sensors
  const stopAR = useCallback(() => {
    camera.stop();
    geo.stop();
    orientation.stop();
    setStarted(false);
  }, [camera, geo, orientation]);

  // Fetch nearby properties when location updates
  useEffect(() => {
    if (!geo.latitude || !geo.longitude) return;

    let cancelled = false;
    const fetchNearby = async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(
          `${API_URL}/api/properties/nearby?lat=${geo.latitude}&lng=${geo.longitude}&radius=500`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Failed to fetch nearby properties");
        const data = await res.json();
        if (!cancelled) {
          // Group by postcode, then spread same-postcode properties across
          // a small arc so they don't all stack on the exact same bearing.
          const byPostcode = new Map();
          for (const p of data.properties || []) {
            const key = p.postcode || "_";
            if (!byPostcode.has(key)) byPostcode.set(key, []);
            byPostcode.get(key).push(p);
          }

          const enriched = [];
          for (const [, group] of byPostcode) {
            group.forEach((p, idx) => {
              if (p.latitude == null || p.longitude == null) {
                enriched.push(p);
                return;
              }
              const n = group.length;
              const spread = 30;
              const offset = n > 1 ? (idx / (n - 1) - 0.5) * spread : 0;
              const baseBearing = getBearing(
                geo.latitude, geo.longitude, p.latitude, p.longitude
              );
              enriched.push({
                ...p,
                bearing: (baseBearing + offset + 360) % 360,
                distance: getDistance(
                  geo.latitude, geo.longitude, p.latitude, p.longitude
                ),
              });
            });
          }
          setProperties(enriched);
          setFetchError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.name !== "AbortError") {
            setFetchError("Could not load nearby properties");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNearby();
    // Refetch every 30 seconds as user moves
    const interval = setInterval(fetchNearby, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [geo.latitude, geo.longitude]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      camera.stop();
      geo.stop();
      orientation.stop();
    };
  }, []);

  const screenWidth = containerRef.current?.clientWidth || window.innerWidth;

  // Check for any blocking issues
  const sensorError = camera.error || geo.error;
  const noCompass = started && orientation.permission === "unsupported";

  // Pre-start screen
  if (!started) {
    return (
      <div className="pv-ar-start">
        <div className="pv-ar-start-content">
          <div className="pv-ar-start-icon">&#128247;</div>
          <h2>AR Property Scanner</h2>
          <p>
            Point your phone at any building to see property prices floating in real-time.
          </p>
          <ul className="pv-ar-requirements">
            <li>&#128205; Location access (GPS)</li>
            <li>&#128247; Camera access (rear)</li>
            <li>&#129517; Compass (device orientation)</li>
          </ul>
          <button className="pv-ar-launch-btn" onClick={startAR}>
            Launch AR Scanner
          </button>
          <button className="pv-ar-back-link" onClick={onBack}>
            Back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="pv-ar-container">
      {/* Camera feed */}
      <video
        ref={camera.videoRef}
        autoPlay
        playsInline
        muted
        className="pv-camera-feed"
      />

      {/* AR Overlay */}
      <div className="pv-ar-overlay">
        {/* Floating property cards */}
        {properties.map((property, i) => {
          if (property.bearing === undefined || orientation.heading === null) return null;

          const x = getScreenX(property.bearing, orientation.heading, screenWidth);
          if (x === null) return null; // Not in FOV

          // Y position based on distance (further = higher on screen)
          const yPercent = property.distance
            ? Math.max(15, Math.min(70, 80 - (property.distance / 200) * 60))
            : 40;

          return (
            <ARPropertyCard
              key={property.id || i}
              property={property}
              style={{
                position: "absolute",
                left: x,
                top: `${yPercent}%`,
              }}
              onClick={() => onSelectProperty(property)}
            />
          );
        })}

        {/* Status bar */}
        <div className="pv-ar-status-bar">
          <div className="pv-ar-status-left">
            <span className="pv-ar-status-dot" />
            <span>
              {loading
                ? "Scanning..."
                : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} nearby`}
            </span>
          </div>
          {orientation.heading !== null && (
            <span className="pv-ar-compass">
              {Math.round(orientation.heading)}&#176;{" "}
              {["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
                Math.round(orientation.heading / 45) % 8
              ]}
            </span>
          )}
        </div>

        {/* Error banner */}
        {(sensorError || fetchError) && (
          <div className="pv-ar-error-banner">
            {sensorError || fetchError}
          </div>
        )}

        {/* No compass fallback */}
        {noCompass && (
          <div className="pv-ar-error-banner">
            Compass not available — cards shown at estimated positions
          </div>
        )}

        {/* Helpful empty state */}
        {!loading && !fetchError && properties.length === 0 && geo.latitude && (
          <div className="pv-ar-empty-hint">
            No property sales in the last 500m.
            <br />
            Try moving to a residential area.
          </div>
        )}

        {/* Waiting for compass */}
        {orientation.heading === null && !sensorError && properties.length > 0 && (
          <div className="pv-ar-empty-hint">
            Move your phone in a figure-8 to calibrate the compass...
          </div>
        )}

        {/* Accuracy indicator */}
        {geo.accuracy && (
          <div className="pv-ar-accuracy">
            GPS: &plusmn;{Math.round(geo.accuracy)}m
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="pv-ar-controls">
        <button className="pv-ar-close-btn" onClick={() => { stopAR(); onBack(); }}>
          &#10005; Close
        </button>
      </div>
    </div>
  );
}
