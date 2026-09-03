import { env } from "@/lib/api/config/env";

export type RouteResult = {
  coordinates: [number, number][]; // [lng, lat] pairs, GeoJSON order
  distanceMeters: number;
  durationSeconds: number;
};

// Mapbox has no dedicated motorcycle profile — "driving" is the closest
// approximation for a moto rider's route.
//
// Mapbox's Directions API has no "shortest distance" mode — it only ever
// optimizes for travel time. requesting alternatives and picking the one
// with the smallest `distance` is the closest approximation available: it
// picks the shortest among Mapbox's (up to 3) suggested routes, not the
// true shortest path overall.
export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteResult | null> {
  if (!env.client.mapboxToken) return null;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?geometries=geojson&overview=full&alternatives=true` +
    `&access_token=${env.client.mapboxToken}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const routes: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }[] =
    data.routes ?? [];
  if (routes.length === 0) return null;

  const shortest = routes.reduce((min, r) => (r.distance < min.distance ? r : min));

  return {
    coordinates: shortest.geometry.coordinates,
    distanceMeters: shortest.distance,
    durationSeconds: shortest.duration,
  };
}
