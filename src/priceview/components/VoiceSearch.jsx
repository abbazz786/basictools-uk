import { useEffect } from "react";
import useVoice from "../hooks/useVoice.js";

const POSTCODE_RE = /[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i;

export default function VoiceSearch({ onResult, onClose }) {
  const { transcript, listening, error, supported, start, stop } = useVoice();

  // Auto-start on mount
  useEffect(() => {
    if (supported) start();
    return () => stop();
  }, []);

  // Try to extract a postcode from transcript
  useEffect(() => {
    if (!transcript || listening) return;

    const match = transcript.match(POSTCODE_RE);
    if (match) {
      onResult(match[0].toUpperCase());
    }
  }, [transcript, listening, onResult]);

  if (!supported) {
    return (
      <div className="pv-voice-overlay">
        <div className="pv-voice-content">
          <div className="pv-voice-icon">&#128263;</div>
          <h3>Not Supported</h3>
          <p>Voice search is not available in this browser. Try Chrome or Safari.</p>
          <button className="pv-voice-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pv-voice-overlay">
      <div className="pv-voice-content">
        <div className={`pv-voice-icon ${listening ? "pv-voice-active" : ""}`}>
          &#127908;
        </div>

        <h3>{listening ? "Listening..." : "Processing..."}</h3>

        <p className="pv-voice-hint">
          {listening
            ? 'Say a postcode, e.g. "SW1A 1AA"'
            : transcript
            ? `Heard: "${transcript}"`
            : "No speech detected"}
        </p>

        {error && <p className="pv-voice-error">{error}</p>}

        {!listening && transcript && !POSTCODE_RE.test(transcript) && (
          <div className="pv-voice-retry">
            <p>Couldn't find a postcode in what you said.</p>
            <button className="pv-voice-retry-btn" onClick={start}>
              Try Again
            </button>
          </div>
        )}

        <div className="pv-voice-actions">
          {listening && (
            <button className="pv-voice-stop" onClick={stop}>
              Stop
            </button>
          )}
          <button className="pv-voice-close" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
