"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "@/lib/api/config/env";
import { cn } from "@/lib/utils";

export type MapPoint = {
  lat: number;
  lng: number;
  label?: string;
};

export type MapStyleId = "streets" | "satellite" | "terrain";

export const MAP_STYLES: { id: MapStyleId; url: string }[] = [
  { id: "streets", url: "mapbox://styles/mapbox/standard" },
  { id: "satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "terrain", url: "mapbox://styles/mapbox/outdoors-v12" },
];

function simplifyStandardStyle(map: mapboxgl.Map) {
  try {
    map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    map.setConfigProperty("basemap", "showTransitLabels", false);
  } catch {}
}

const GOMA_CENTER: MapPoint = { lat: -1.6792, lng: 29.2228 };

const RETRY_DELAYS_MS = [1000, 2000, 4000];

export type RouteLine = {
  id: string;
  coordinates: [number, number][];
  color: string;
};

const STRINGS = {
  en: { failed: "Couldn't load the map.", retry: "Retry" },
  fr: { failed: "Impossible de charger la carte.", retry: "Réessayer" },
} as const;

export type TrackMapHandle = {
  recenter: () => void;
  setMapStyle: (styleId: MapStyleId) => void;
};

function buildMarkerElement(key: string, label: string | undefined) {
  const wrap = document.createElement("div");
  wrap.className = "track-marker-wrap";

  if (label) {
    const labelEl = document.createElement("div");
    labelEl.className = "track-marker-label";
    labelEl.textContent = label;
    wrap.appendChild(labelEl);
  }

  const dot = document.createElement("div");
  dot.className = `track-marker track-marker--${key}`;
  wrap.appendChild(dot);

  return wrap;
}

export const TrackMap = forwardRef<
  TrackMapHandle,
  {
    from: MapPoint | null;
    to: MapPoint | null;
    rider: MapPoint | null;
    routes?: RouteLine[];
    locale?: "en" | "fr";
    className?: string;
  }
>(function TrackMap(
  { from, to, rider, routes, locale = "en", className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const routeIdsRef = useRef<Set<string>>(new Set());
  const currentStyleUrlRef = useRef<string>(MAP_STYLES[0].url);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const t = STRINGS[locale];

  const latestRef = useRef({ from, to, rider, routes });
  latestRef.current = { from, to, rider, routes };

  const syncMarkers = (map: mapboxgl.Map, fitBounds: boolean) => {
    const { from, to, rider } = latestRef.current;
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
        const labelEl = markersRef.current[key]
          .getElement()
          .querySelector(".track-marker-label");
        if (labelEl && labelEl.textContent !== (point.label ?? "")) {
          labelEl.textContent = point.label ?? "";
        }
      } else {
        markersRef.current[key] = new mapboxgl.Marker({
          element: buildMarkerElement(key, point.label),
          anchor: "bottom",
        })
          .setLngLat([point.lng, point.lat])
          .addTo(map);
      }
    }

    if (hasPoint && fitBounds) {
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 600 });
    }
  };

  const syncRoutes = (map: mapboxgl.Map) => {
    const { routes } = latestRef.current;
    const activeIds = new Set((routes ?? []).map((r) => r.id));

    for (const id of routeIdsRef.current) {
      if (activeIds.has(id)) continue;
      const layerId = `route-line-${id}`;
      const sourceId = `route-${id}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      routeIdsRef.current.delete(id);
    }

    for (const r of routes ?? []) {
      const sourceId = `route-${r.id}`;
      const layerId = `route-line-${r.id}`;
      const data = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: r.coordinates,
        },
      };

      const existingSource = map.getSource(sourceId) as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (existingSource) {
        existingSource.setData(data);
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, "line-color", r.color);
        }
      } else {
        map.addSource(sourceId, { type: "geojson", data });
        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          slot: "top",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": r.color,
            "line-width": 4,
            "line-opacity": 0.85,
          },
        });
        routeIdsRef.current.add(r.id);
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = to ?? from ?? GOMA_CENTER;
    const initialStyle = currentStyleUrlRef.current;

    const map = new mapboxgl.Map({
      accessToken: env.client.mapboxToken,
      container: containerRef.current,
      style: initialStyle,
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

    map.on("style.load", () => {
      simplifyStandardStyle(map);
      routeIdsRef.current.clear();
      syncMarkers(map, false);
      syncRoutes(map);
    });

    map.on("error", (e) => {
      // eslint-disable-next-line no-console
      console.error("[TrackMap] mapbox error:", e.error?.message ?? e);
      if (map.isStyleLoaded()) return;
      clearRetryTimeout();
      if (retryCountRef.current < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[retryCountRef.current];
        retryCountRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => {
          if (mapRef.current === map) map.setStyle(currentStyleUrlRef.current);
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
      routeIdsRef.current.clear();
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
      map.setStyle(currentStyleUrlRef.current);
    } else {
      setRetryToken((n) => n + 1);
    }
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      const map = mapRef.current;
      if (map) syncMarkers(map, true);
    },
    setMapStyle: (styleId) => {
      const map = mapRef.current;
      const style = MAP_STYLES.find((s) => s.id === styleId);
      if (!map || !style) return;
      currentStyleUrlRef.current = style.url;
      map.setStyle(style.url);
    },
  }));

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      syncMarkers(map, true);
    } else {
      map.once("load", () => syncMarkers(map, true));
    }
  }, [from, to, rider]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      syncRoutes(map);
    } else {
      map.once("load", () => syncRoutes(map));
    }
  }, [routes]);

  return (
    <div className={cn("relative h-full w-full", className)}>
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
});

export default TrackMap;
