"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { env } from "@/lib/api/config/env";

export type MapPoint = {
  lat: number;
  lng: number;
};

// streets-v12 (not the minimalist light/dark styles) so the map reads as
// an obvious map at a glance — the pale grays-on-white minimalist styles
// are, at low zoom with sparse features, visually indistinguishable from
// a blank page even when rendering correctly.
const LIGHT_STYLE = "mapbox://styles/mapbox/streets-v12";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

// Fallback when neither delivery nor shop coordinates are available yet —
// centers on Goma instead of [0, 0], which is empty ocean off West Africa
// and reads as a blank map.
const GOMA_CENTER: MapPoint = { lat: -1.6792, lng: 29.2228 };

const RETRY_DELAYS_MS = [1000, 2000, 4000];

const STRINGS = {
  en: { failed: "Couldn't load the map.", retry: "Retry" },
  fr: { failed: "Impossible de charger la carte.", retry: "Réessayer" },
} as const;

export function TrackMap({
  from,
  to,
  rider,
  locale = "en",
  className,
}: {
  from: MapPoint | null;
  to: MapPoint | null;
  rider: MapPoint | null;
  locale?: "en" | "fr";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const { resolvedTheme } = useTheme();
  const t = STRINGS[locale];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = to ?? from ?? GOMA_CENTER;
    const style = resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE;

    const map = new mapboxgl.Map({
      accessToken: env.client.mapboxToken,
      container: containerRef.current,
      style,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: to || from ? 13 : 12,
    });
    mapRef.current = map;

    const clearRetryTimeout = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    map.once("load", () => {
      clearRetryTimeout();
      retryCountRef.current = 0;
      setLoadFailed(false);
    });

    // The style/tile fetch can fail transiently (flaky network, DNS hiccup,
    // account/billing issues) and mapbox-gl otherwise just leaves a
    // permanently blank canvas with no visible feedback. Retry with
    // backoff before giving up and showing an explicit failure state.
    map.on("error", (e) => {
      // eslint-disable-next-line no-console
      console.error("[TrackMap] mapbox error:", e.error?.message ?? e);
      if (map.isStyleLoaded()) return;
      clearRetryTimeout();
      if (retryCountRef.current < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[retryCountRef.current];
        retryCountRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => {
          if (mapRef.current === map) map.setStyle(style);
        }, delay);
      } else {
        setLoadFailed(true);
      }
    });

    // trackResize (on by default) only reacts to window resizes, not to
    // this container's own size settling after sibling content loads or
    // layout shifts — without this, Mapbox's internal viewport can stay
    // out of sync with the canvas's actual on-screen size, so it renders
    // into the wrong region and looks blank despite loading successfully.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      clearRetryTimeout();
      resizeObserver.disconnect();
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryToken]);

  const handleManualRetry = () => {
    retryCountRef.current = 0;
    setLoadFailed(false);
    const map = mapRef.current;
    if (map) {
      map.setStyle(resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE);
    } else {
      setRetryToken((n) => n + 1);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const nextStyle = resolvedTheme === "dark" ? DARK_STYLE : LIGHT_STYLE;
    const applyStyle = () => {
      if (mapRef.current === map) map.setStyle(nextStyle);
    };

    if (map.isStyleLoaded()) {
      applyStyle();
    } else {
      map.once("load", applyStyle);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateMarkers = () => {
      const points: Record<string, MapPoint | null> = { from, to, rider };
      const bounds = new mapboxgl.LngLatBounds();
      let hasPoint = false;

      for (const [key, point] of Object.entries(points)) {
        if (!point) {
          markersRef.current[key]?.remove();
          delete markersRef.current[key];
          continue;
        }

        hasPoint = true;
        bounds.extend([point.lng, point.lat]);

        if (markersRef.current[key]) {
          markersRef.current[key].setLngLat([point.lng, point.lat]);
        } else {
          const el = document.createElement("div");
          el.className = `track-marker track-marker--${key}`;
          markersRef.current[key] = new mapboxgl.Marker({ element: el })
            .setLngLat([point.lng, point.lat])
            .addTo(map);
        }
      }

      if (hasPoint) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 600 });
      }
    };

    if (map.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.once("load", updateMarkers);
    }
  }, [from, to, rider]);

  return (
    <div className={className ?? "size-full"} style={{ position: "relative" }}>
      <div ref={containerRef} className="size-full" />
      {loadFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-4 text-center">
          <p className="text-sm text-muted-foreground">{t.failed}</p>
          <button
            type="button"
            onClick={handleManualRetry}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t.retry}
          </button>
        </div>
      )}
    </div>
  );
}

export default TrackMap;
