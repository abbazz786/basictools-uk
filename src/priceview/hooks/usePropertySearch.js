import { useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function usePropertySearch() {
  const [results, setResults] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (postcode) => {
    const cleaned = postcode.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(cleaned)) {
      setError("Enter a valid UK postcode (e.g. SW1A 1AA)");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setLocation(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(
        `${API_URL}/api/properties?postcode=${encodeURIComponent(cleaned)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "No data found for this postcode" : "Failed to fetch property data");
      }
      const data = await res.json();
      setResults(data.properties || []);
      setLocation(data.location || null);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else if (err.message === "Failed to fetch") {
        setError("Cannot reach the PriceView server. Please try again later.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, location, loading, error, search };
}
