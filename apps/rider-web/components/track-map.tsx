"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type MapPoint = { lat: number; lng: number };

const STYLE = "mapbox://styles/mapbox/streets-v12";

// Fallback when no points are available yet — centers on Goma instead of
// [0, 0], which is empty ocean off West Africa and reads as a blank map.
const GOMA_CENTER: MapPoint = { lat: -1.6792, lng: 29.2228 };

const RETRY_DELAYS_MS = [1000, 2000, 4000];
const ROUTE_SOURCE_ID = "route";
const ROUTE_LAYER_ID = "route-line";

export function TrackMap({
  from,
  to,
  rider,
  route,
  className,
}: {
  from: MapPoint | null;
  to: MapPoint | null;
  rider: MapPoint | null;
  route?: [number, number][] | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = to ?? from ?? GOMA_CENTER;

    const map = new mapboxgl.Map({
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
      container: containerRef.current,
      style: STYLE,
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

      map.addSource(ROUTE_SOURCE_ID, {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: "line",
        source: ROUTE_SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ea580c", "line-width": 4, "line-opacity": 0.85 },
      });
    });

    map.on("error", (e) => {
      console.error("[TrackMap] mapbox error:", e.error?.message ?? e);
      if (map.isStyleLoaded()) return;
      clearRetryTimeout();
      if (retryCountRef.current < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[retryCountRef.current];
        retryCountRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => {
          if (mapRef.current === map) map.setStyle(STYLE);
        }, delay);
      } else {
        setLoadFailed(true);
      }
    });

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
      map.setStyle(STYLE);
    } else {
      setRetryToken((n) => n + 1);
    }
  };

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
          el.style.width = key === "rider" ? "18px" : "14px";
          el.style.height = el.style.width;
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
          el.style.background =
            key === "rider" ? "#ea580c" : key === "to" ? "#16a34a" : "#2563eb";
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRoute = () => {
      const source = map.getSource(ROUTE_SOURCE_ID) as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (!source) return;
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: route ?? [] },
      });
    };

    if (map.isStyleLoaded()) {
      updateRoute();
    } else {
      map.once("load", updateRoute);
    }
  }, [route]);

  return (
    <div className={className ?? "size-full"} style={{ position: "relative" }}>
      <div ref={containerRef} className="size-full" />
      {loadFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 p-4 text-center">
          <p className="text-sm text-muted-foreground">Couldn&apos;t load the map.</p>
          <button
            type="button"
            onClick={handleManualRetry}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default TrackMap;
