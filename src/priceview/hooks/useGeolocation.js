import { useState, useEffect, useCallback } from "react";

export default function useGeolocation() {
  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    supported: "geolocation" in navigator,
  });

  const [watching, setWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocation not supported" }));
      return;
    }

    setWatching(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          supported: true,
        });
      },
      (err) => {
        const messages = {
          1: "Location permission denied. Please allow location access.",
          2: "Location unavailable. Try moving outdoors.",
          3: "Location request timed out.",
        };
        setState((prev) => ({
          ...prev,
          error: messages[err.code] || err.message,
          supported: true,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    setWatchId(id);
  }, []);

  const stop = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setWatching(false);
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return { ...state, watching, start, stop };
}
