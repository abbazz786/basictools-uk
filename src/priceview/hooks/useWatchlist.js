import { useState, useCallback, useEffect } from "react";

const WATCHLIST_KEY = "pv_watchlist";
const HISTORY_KEY = "pv_search_history";
const MAX_HISTORY = 20;

function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function useWatchlist() {
  const [items, setItems] = useState(() => loadJSON(WATCHLIST_KEY));

  useEffect(() => {
    saveJSON(WATCHLIST_KEY, items);
  }, [items]);

  const add = useCallback((property) => {
    setItems((prev) => {
      // Deduplicate by address + postcode
      const key = `${property.address || property.address_line_1}|${property.postcode}`;
      if (prev.some((p) => `${p.address || p.address_line_1}|${p.postcode}` === key)) {
        return prev;
      }
      return [{ ...property, watchedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const remove = useCallback((property) => {
    setItems((prev) => {
      const key = `${property.address || property.address_line_1}|${property.postcode}`;
      return prev.filter((p) => `${p.address || p.address_line_1}|${p.postcode}` !== key);
    });
  }, []);

  const isWatched = useCallback(
    (property) => {
      const key = `${property.address || property.address_line_1}|${property.postcode}`;
      return items.some((p) => `${p.address || p.address_line_1}|${p.postcode}` === key);
    },
    [items]
  );

  const clear = useCallback(() => setItems([]), []);

  return { items, add, remove, isWatched, clear };
}

export function useSearchHistory() {
  const [history, setHistory] = useState(() => loadJSON(HISTORY_KEY));

  useEffect(() => {
    saveJSON(HISTORY_KEY, history);
  }, [history]);

  const addSearch = useCallback((search) => {
    setHistory((prev) => {
      const entry = {
        query: search.query || search,
        type: search.type || "postcode",
        timestamp: new Date().toISOString(),
      };
      // Remove duplicate
      const filtered = prev.filter((h) => h.query !== entry.query);
      return [entry, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { history, addSearch, clearHistory };
}
