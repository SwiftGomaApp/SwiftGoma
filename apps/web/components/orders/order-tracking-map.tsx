"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { createMapPinElement } from "@/components/orders/map-pin";
import {
  fitMapToCoordinates,
  getMapboxToken,
  GOMA_CENTER,
  MAPBOX_STYLE,
  TRACKING_MAP_PADDING,
  type MapCoordinate,
} from "@/lib/mapbox";
import type { LiveLocation } from "@/lib/order-tracking";
import { cn } from "@/lib/utils";

type OrderTrackingMapProps = {
  destination: MapCoordinate;
  riderLocation: LiveLocation | null;
  className?: string;
};

const ROUTE_SOURCE = "tracking-route";
const ROUTE_LAYER = "tracking-route-line";

export function OrderTrackingMap({
  destination,
  riderLocation,
  className,
}: OrderTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const riderMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const hasFitBoundsRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const token = getMapboxToken();
    const container = containerRef.current;
    if (!container || !token) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container,
      style:
        resolvedTheme === "dark" ? MAPBOX_STYLE.dark : MAPBOX_STYLE.light,
      center: [destination.longitude, destination.latitude],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    map.on("load", () => {
      map.resize();
      map.setPadding(TRACKING_MAP_PADDING);
      setMapReady(true);

      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });

      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": resolvedTheme === "dark" ? "#f97316" : "#ea580c",
          "line-width": 4,
          "line-opacity": 0.75,
          "line-dasharray": [2, 2],
        },
      });

      destinationMarkerRef.current = new mapboxgl.Marker({
        element: createMapPinElement("destination"),
        anchor: "bottom",
      })
        .setLngLat([destination.longitude, destination.latitude])
        .addTo(map);
    });

    mapRef.current = map;
    hasFitBoundsRef.current = false;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      setMapReady(false);
      destinationMarkerRef.current?.remove();
      riderMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      destinationMarkerRef.current = null;
      riderMarkerRef.current = null;
    };
  }, [destination.latitude, destination.longitude, resolvedTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (riderLocation) {
      const lngLat: [number, number] = [
        riderLocation.longitude,
        riderLocation.latitude,
      ];

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLngLat(lngLat);
      } else {
        riderMarkerRef.current = new mapboxgl.Marker({
          element: createMapPinElement("rider"),
          anchor: "bottom",
        })
          .setLngLat(lngLat)
          .addTo(map);
      }

      const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource;
      source?.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [riderLocation.longitude, riderLocation.latitude],
            [destination.longitude, destination.latitude],
          ],
        },
      });

      if (!hasFitBoundsRef.current) {
        fitMapToCoordinates(
          map,
          mapboxgl.LngLatBounds,
          [riderLocation, destination],
          40,
        );
        hasFitBoundsRef.current = true;
      }
    } else {
      riderMarkerRef.current?.remove();
      riderMarkerRef.current = null;

      const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource;
      source?.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      });

      if (!hasFitBoundsRef.current) {
        map.flyTo({
          center: [destination.longitude, destination.latitude],
          zoom: 14,
          duration: 800,
        });
        hasFitBoundsRef.current = true;
      }
    }
  }, [destination, riderLocation, mapReady]);

  if (!getMapboxToken()) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-sm text-muted-foreground",
          className,
        )}
      >
        Configurez NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN pour afficher la carte.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("mapbox-tracking-map h-full w-full", className)}
    />
  );
}

export { GOMA_CENTER };
