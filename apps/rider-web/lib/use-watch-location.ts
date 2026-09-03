"use client";

import { useEffect, useRef, useState } from "react";

const EMIT_THROTTLE_MS = 8000;

export function useWatchLocation(
  enabled: boolean,
  onUpdate: (lat: number, lng: number) => void,
) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const lastEmitRef = useRef(0);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        setError(null);

        const now = Date.now();
        if (now - lastEmitRef.current >= EMIT_THROTTLE_MS) {
          lastEmitRef.current = now;
          onUpdateRef.current(lat, lng);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location permission denied. Allow it in your browser's site settings, then reload.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError(
            "Location unavailable. Check that location services are enabled on this device.",
          );
        } else {
          setError("Timed out getting your location. Retrying…");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}
