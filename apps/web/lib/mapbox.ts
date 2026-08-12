export const GOMA_CENTER = {
  latitude: -1.6785,
  longitude: 29.2174,
} as const;

export const MAPBOX_STYLE = {
  light: "mapbox://styles/mapbox/streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
} as const;

export function getMapboxToken() {
  return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
}

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapPadding =
  | number
  | { top?: number; bottom?: number; left?: number; right?: number };

export const TRACKING_MAP_PADDING = {
  top: 24,
  bottom: 260,
  left: 48,
  right: 48,
} as const;

export function fitMapToCoordinates(
  map: import("mapbox-gl").Map,
  LngLatBounds: typeof import("mapbox-gl").LngLatBounds,
  points: MapCoordinate[],
  padding: MapPadding = 80,
) {
  if (points.length === 0) return;

  const bounds = new LngLatBounds(
    [points[0].longitude, points[0].latitude],
    [points[0].longitude, points[0].latitude],
  );

  for (const point of points.slice(1)) {
    bounds.extend([point.longitude, point.latitude]);
  }

  map.fitBounds(bounds, { padding, maxZoom: 15, duration: 800 });
}
