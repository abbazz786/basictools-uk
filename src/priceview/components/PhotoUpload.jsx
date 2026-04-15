import { useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function PhotoUpload({ onResult, onClose }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Extract EXIF GPS if available, then send to API
    analyzePhoto(file);
  };

  const analyzePhoto = async (file) => {
    setLoading(true);
    setError(null);

    try {
      // Read as base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(",")[1]);
        reader.readAsDataURL(file);
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(`${API_URL}/api/v1/photo/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Could not identify property from photo");

      const data = await res.json();
      setResult(data);

      // If we got a postcode, send it back
      if (data.postcode) {
        onResult(data.postcode);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out");
      } else if (err.message === "Failed to fetch") {
        setError("Cannot reach server");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pv-photo-overlay">
      <div className="pv-photo-content">
        <h3>&#128248; Photo Lookup</h3>
        <p>Upload a photo of a property to find its sale history.</p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />

        {!preview && (
          <div className="pv-photo-actions-grid">
            <button
              className="pv-photo-btn"
              onClick={() => {
                fileRef.current.setAttribute("capture", "environment");
                fileRef.current.click();
              }}
            >
              <span>&#128247;</span>
              <span>Take Photo</span>
            </button>
            <button
              className="pv-photo-btn"
              onClick={() => {
                fileRef.current.removeAttribute("capture");
                fileRef.current.click();
              }}
            >
              <span>&#128193;</span>
              <span>Choose File</span>
            </button>
          </div>
        )}

        {preview && (
          <div className="pv-photo-preview">
            <img src={preview} alt="Uploaded property" />
          </div>
        )}

        {loading && (
          <div className="pv-photo-status">
            <span className="pv-spinner" />
            <span>Analyzing photo...</span>
          </div>
        )}

        {error && <p className="pv-voice-error">{error}</p>}

        {result && result.suggestions && (
          <div className="pv-photo-suggestions">
            <p>Possible matches:</p>
            {result.suggestions.map((s, i) => (
              <button
                key={i}
                className="pv-address-option"
                onClick={() => onResult(s.postcode)}
              >
                <span className="pv-address-option-main">{s.address}</span>
                <span className="pv-address-option-pc">{s.postcode}</span>
              </button>
            ))}
          </div>
        )}

        <button className="pv-voice-close" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
