import { useState, lazy, Suspense } from "react";
import './styles/priceview.css';
import SearchBar from './components/SearchBar.jsx';
import AddressSearch from './components/AddressSearch.jsx';
import URLPaste from './components/URLPaste.jsx';
import PropertyList from './components/PropertyList.jsx';
import PropertyDetail from './components/PropertyDetail.jsx';
import SearchHistory from './components/SearchHistory.jsx';
import Watchlist from './components/Watchlist.jsx';
import NearMe from './components/NearMe.jsx';
import usePropertySearch from './hooks/usePropertySearch.js';
import { useWatchlist, useSearchHistory } from './hooks/useWatchlist.js';

const MapView = lazy(() => import('./components/MapView.jsx'));
const ARView = lazy(() => import('./components/ARView.jsx'));
const VoiceSearch = lazy(() => import('./components/VoiceSearch.jsx'));
const PhotoUpload = lazy(() => import('./components/PhotoUpload.jsx'));

export default function PriceView({ onBack }) {
  const [postcode, setPostcode] = useState("");
  const { results, location, loading, error, search } = usePropertySearch();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("list"); // "list" | "map" | "scan" | "nearme" | "watchlist"
  const [showVoice, setShowVoice] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  const watchlist = useWatchlist();
  const { history, addSearch, clearHistory } = useSearchHistory();

  const handleSearch = (pc) => {
    setPostcode(pc);
    setSelected(null);
    setView("list");
    search(pc);
    addSearch({ query: pc, type: "postcode" });
    setShowVoice(false);
    setShowPhoto(false);
  };

  const handleAddressResult = (pc) => {
    handleSearch(pc);
  };

  const handleSelectProperty = (property) => {
    setSelected(property);
  };

  // AR scan mode — full-screen takeover
  if (view === "scan") {
    return (
      <div className="pv-container">
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <Suspense fallback={
          <div className="pv-ar-start">
            <div className="pv-ar-start-content">
              <div className="pv-ar-start-icon">&#128247;</div>
              <p>Loading AR Scanner...</p>
            </div>
          </div>
        }>
          <ARView
            onSelectProperty={handleSelectProperty}
            onBack={() => setView("list")}
          />
        </Suspense>

        {selected && (
          <PropertyDetail
            property={selected}
            allResults={results}
            isWatched={watchlist.isWatched(selected)}
            onToggleWatch={() =>
              watchlist.isWatched(selected)
                ? watchlist.remove(selected)
                : watchlist.add(selected)
            }
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="pv-container">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="pv-header">
        <button className="pv-back-btn" onClick={onBack}>
          <span>&#8592;</span> BasicTools
        </button>
        <div className="pv-logo">
          <span className="pv-logo-text">PRICE</span>
          <span className="pv-logo-accent">VIEW</span>
        </div>
        <p className="pv-tagline">What's it worth?</p>
      </header>

      {/* Primary Search — postcode */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Quick action buttons — voice, photo */}
      <div className="pv-quick-actions">
        <button className="pv-quick-btn" onClick={() => setShowVoice(true)}>
          &#127908; Voice
        </button>
        <button className="pv-quick-btn" onClick={() => setShowPhoto(true)}>
          &#128247; Photo
        </button>
        <button
          className={`pv-quick-btn ${view === "nearme" ? "active" : ""}`}
          onClick={() => setView(view === "nearme" ? "list" : "nearme")}
        >
          &#128205; Near Me
        </button>
        <button
          className={`pv-quick-btn ${view === "watchlist" ? "active" : ""}`}
          onClick={() => setView(view === "watchlist" ? "list" : "watchlist")}
        >
          &#9733; Saved ({watchlist.items.length})
        </button>
      </div>

      {/* Secondary searches — address + URL paste */}
      <div className="pv-secondary-search">
        <AddressSearch onResult={handleAddressResult} />
        <URLPaste onResult={handleAddressResult} />
      </div>

      {/* View toggle (only when we have results or in default views) */}
      {view !== "nearme" && view !== "watchlist" && (
        <div className="pv-view-toggle">
          <button
            className={`pv-view-btn ${view === "list" ? "active" : ""}`}
            onClick={() => setView("list")}
          >
            List
          </button>
          <button
            className={`pv-view-btn ${view === "map" ? "active" : ""}`}
            onClick={() => setView("map")}
          >
            Map
          </button>
          <button
            className="pv-view-btn pv-scan-toggle"
            onClick={() => setView("scan")}
          >
            &#128247; Scan
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="pv-error">
          <span>{error}</span>
        </div>
      )}

      {/* Voice overlay */}
      {showVoice && (
        <Suspense fallback={null}>
          <VoiceSearch
            onResult={(pc) => {
              setShowVoice(false);
              handleSearch(pc);
            }}
            onClose={() => setShowVoice(false)}
          />
        </Suspense>
      )}

      {/* Photo overlay */}
      {showPhoto && (
        <Suspense fallback={null}>
          <PhotoUpload
            onResult={(pc) => {
              setShowPhoto(false);
              handleSearch(pc);
            }}
            onClose={() => setShowPhoto(false)}
          />
        </Suspense>
      )}

      {/* Near Me view */}
      {view === "nearme" && (
        <NearMe onSelect={handleSelectProperty} />
      )}

      {/* Watchlist view */}
      {view === "watchlist" && (
        <div className="pv-results-header-wrap">
          <Watchlist
            items={watchlist.items}
            onSelect={handleSelectProperty}
            onRemove={watchlist.remove}
          />
        </div>
      )}

      {/* List results */}
      {view === "list" && (
        <PropertyList
          results={results}
          loading={loading}
          onSelect={handleSelectProperty}
        />
      )}

      {/* Map results */}
      {view === "map" && results.length > 0 && (
        <Suspense fallback={<div className="pv-map-placeholder"><p>Loading map...</p></div>}>
          <MapView
            properties={results}
            location={location}
            onSelectProperty={handleSelectProperty}
          />
        </Suspense>
      )}

      {/* Detail sheet */}
      {selected && (
        <PropertyDetail
          property={selected}
          allResults={results}
          isWatched={watchlist.isWatched(selected)}
          onToggleWatch={() =>
            watchlist.isWatched(selected)
              ? watchlist.remove(selected)
              : watchlist.add(selected)
          }
          onClose={() => setSelected(null)}
        />
      )}

      {/* Empty state — show search history + example postcodes */}
      {!loading && !error && results.length === 0 && !postcode && view === "list" && (
        <>
          <SearchHistory
            history={history}
            onSelect={handleSearch}
            onClear={clearHistory}
          />

          <div className="pv-empty-state">
            <div className="pv-empty-icon">&#127968;</div>
            <h2>Search any UK postcode</h2>
            <p>See every property sale from HM Land Registry — prices, dates, property types.</p>
            <div className="pv-example-postcodes">
              {["SW1A 1AA", "M1 1AE", "BS1 5TY", "EH1 1YZ"].map((pc) => (
                <button key={pc} className="pv-example-btn" onClick={() => handleSearch(pc)}>
                  {pc}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
