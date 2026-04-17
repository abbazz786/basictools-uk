import { useState, useRef, useCallback, useEffect } from "react";

export default function useCamera() {
  const videoElRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);

  // Attach stream to video element (idempotent). Called from both
  // the callback ref (when video mounts) and start() (when stream arrives).
  const attach = useCallback(() => {
    const video = videoElRef.current;
    const stream = streamRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      // Safari iOS needs explicit play()
      video.play?.().catch(() => {});
    }
  }, []);

  // Callback ref — fires whenever the <video> mounts or unmounts
  const videoRef = useCallback((node) => {
    videoElRef.current = node;
    if (node) attach();
  }, [attach]);

  const start = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = s;
      setActive(true);
      setError(null);
      attach();
    } catch (err) {
      const messages = {
        NotAllowedError: "Camera permission denied. Please allow camera access.",
        NotFoundError: "No camera found on this device.",
        NotReadableError: "Camera is in use by another app.",
        OverconstrainedError: "Camera requirements not met.",
        SecurityError: "Camera requires HTTPS.",
      };
      setError(messages[err.name] || `Camera error: ${err.name}`);
      setActive(false);
    }
  }, [attach]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
    }
    setActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { videoRef, active, error, start, stop };
}
