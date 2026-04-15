import { useState, useEffect } from "react";
import useGeolocation from "../hooks/useGeolocation.js";
import PropertyList from "./PropertyList.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function NearMe({ onSelect }) {
  const geo = useGeolocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    geo.start();
    setStarted(true);
  };

  // Fetch nearby when we get location
  useEffect(() => {
    if (!geo.latitude || !geo.longitude) return;

    let cancelled = false;
    const fetchNearby = async () => {
      setLoading(true);
      setError(null);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(
          `${API_URL}/api/v1/properties/nearby?lat=${geo.latitude}&lng=${geo.longitude}&radius=500`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("No nearby properties found");
        const data = await res.json();
        if (!cancelled) {
          setResults(data.properties || []);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.name === "AbortError") {
            setError("Request timed out");
          } else if (err.message === "Failed to fetch") {
            setError("Cannot reach server");
          } else {
            setError(err.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNearby();
    return () => { cancelled = true; };
  }, [geo.latitude, geo.longitude]);

  if (!started) {
    return (
      <div className="pv-nearme-start">
        <div className="pv-nearme-icon">&#128205;</div>
        <h3>Properties Near You</h3>
        <p>Find every property sale within 500m of your current location.</p>
        <button className="pv-nearme-btn" onClick={handleStart}>
          Use My Location
        </button>
      </div>
    );
  }

  if (geo.error) {
    return (
      <div className="pv-nearme-start">
        <div className="pv-nearme-icon">&#9888;&#65039;</div>
        <h3>Location Error</h3>
        <p>{geo.error}</p>
        <button className="pv-nearme-btn" onClick={handleStart}>
          Try Again
        </button>
      </div>
    );
  }

  if (!geo.latitude) {
    return (
      <div className="pv-nearme-start">
        <div className="pv-nearme-icon"><span className="pv-spinner" /></div>
        <h3>Getting your location...</h3>
        <p>Please allow location access when prompted.</p>
      </div>
    );
  }

  return (
    <div className="pv-nearme-results">
      <div className="pv-nearme-header">
        <span>&#128205; Properties within 500m</span>
        {geo.accuracy && (
          <span className="pv-nearme-accuracy">&plusmn;{Math.round(geo.accuracy)}m</span>
        )}
      </div>

      {error && (
        <div className="pv-error" style={{ margin: "0 0 16px" }}>
          <span>{error}</span>
        </div>
      )}

      <PropertyList results={results} loading={loading} onSelect={onSelect} />

      {!loading && !error && results.length === 0 && (
        <div className="pv-nearme-empty">
          <p>No property sales found within 500m. Try moving to a residential area.</p>
        </div>
      )}
    </div>
  );
}
