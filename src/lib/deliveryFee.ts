/**
 * Delivery fee calculation utilities
 * Pricing: ₹100 base + ₹50/km
 */

const BASE_FEE = 100;    // ₹100 base fee
const FEE_PER_KM = 50;  // ₹50 per km

export function calculateDeliveryFee(distanceKm: number): number {
  return BASE_FEE + Math.ceil(distanceKm) * FEE_PER_KM;
}

/**
 * Haversine formula — straight-line distance between two lat/lng points.
 * No API call needed.
 */
export function getDistanceKm(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((destLat - originLat) * Math.PI) / 180;
  const dLon = ((destLng - originLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((originLat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Geocode a Plus Code or address string to lat/lng coordinates via Google Maps API.
 * Returns null if the API key is missing or the request fails.
 */
export async function getCoordinatesFromAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location as { lat: number; lng: number };
    }
    return null;
  } catch {
    return null;
  }
}
