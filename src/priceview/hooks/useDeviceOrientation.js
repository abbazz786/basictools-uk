import { useState, useEffect, useCallback } from "react";

export default function useDeviceOrientation() {
  const [heading, setHeading] = useState(null);
  const [permission, setPermission] = useState("unknown"); // "unknown" | "granted" | "denied" | "unsupported"
  const [listening, setListening] = useState(false);

  const handleOrientation = useCallback((event) => {
    // webkitCompassHeading is the most reliable on iOS (true north)
    if (event.webkitCompassHeading !== undefined) {
      setHeading(event.webkitCompassHeading);
    } else if (event.alpha !== null) {
      // Android: alpha is relative to device orientation, not true north
      // Approximate compass heading (0 = North, 90 = East, etc.)
      // alpha goes 0-360 counterclockwise, compass is clockwise
      setHeading(360 - event.alpha);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    // iOS 13+ requires explicit permission
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === "granted") {
          setPermission("granted");
          window.addEventListener("deviceorientation", handleOrientation, true);
          setListening(true);
        } else {
          setPermission("denied");
        }
      } catch {
        setPermission("denied");
      }
    } else if (typeof DeviceOrientationEvent !== "undefined") {
      // Android + desktop: no permission needed
      setPermission("granted");
      window.addEventListener("deviceorientation", handleOrientation, true);
      setListening(true);
    } else {
      setPermission("unsupported");
    }
  }, [handleOrientation]);

  const stop = useCallback(() => {
    window.removeEventListener("deviceorientation", handleOrientation, true);
    setListening(false);
  }, [handleOrientation]);

  useEffect(() => {
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation]);

  return { heading, permission, listening, requestPermission, stop };
}
