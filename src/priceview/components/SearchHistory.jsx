export default function SearchHistory({ history, onSelect, onClear }) {
  if (history.length === 0) return null;

  const fmtTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="pv-search-history">
      <div className="pv-history-header">
        <span className="pv-section-title">Recent Searches</span>
        <button className="pv-history-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="pv-history-list">
        {history.map((entry, i) => (
          <button
            key={i}
            className="pv-history-item"
            onClick={() => onSelect(entry.query)}
          >
            <span className="pv-history-query">{entry.query}</span>
            <span className="pv-history-time">{fmtTime(entry.timestamp)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
