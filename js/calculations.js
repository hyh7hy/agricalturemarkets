// js/calculations.js
// All distance + economics math lives here so every page uses the exact
// same formulas (important for research integrity — see README §14/§40).

/**
 * Straight-line ("as the crow flies") distance between two coordinates,
 * in kilometers, using the Haversine formula. This is NOT road distance;
 * always label it as approximate/straight-line in the UI.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => typeof v !== "number" || Number.isNaN(v))) return null;
  const R = 6371; // Earth radius, km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function toRad(deg) { return (deg * Math.PI) / 180; }

/** Human-readable distance label, e.g. "850 m away" / "14 km away". */
export function formatDistance(km) {
  if (km === null || km === undefined || Number.isNaN(km)) return "Distance unknown";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}
export function formatDistanceApprox(km) {
  if (km === null || km === undefined) return "";
  if (km < 1) return `Approx. ${Math.round(km * 1000)} m straight-line`;
  return `Approx. ${km < 10 ? km.toFixed(1) : Math.round(km)} km straight-line`;
}

/**
 * Very rough default transport-cost estimator used ONLY when a user has
 * not supplied their own transport estimate. It is a simple, clearly-
 * labeled placeholder (ETB per km per the whole shipment), not a claim
 * about real trucking rates. Configurable in one place.
 */
export const DEFAULT_TRANSPORT_RATE_ETB_PER_KM = 15; // editable placeholder rate

export function estimateTransportCost(distanceKm, ratePerKm = DEFAULT_TRANSPORT_RATE_ETB_PER_KM) {
  if (distanceKm === null || distanceKm === undefined) return null;
  return Math.round(distanceKm * ratePerKm);
}

/**
 * Core research formula: NR = (P x Q) - T
 * pricePerKg: ETB per kg
 * quantityKg: total kg
 * transportCost: ETB, user-entered OR estimated (kept distinguishable
 * upstream — see offers.js `transportSource`)
 */
export function calcNetReturn({ pricePerKg, quantityKg, transportCost }) {
  if ([pricePerKg, quantityKg, transportCost].some(v => typeof v !== "number" || Number.isNaN(v))) return null;
  const gross = pricePerKg * quantityKg;
  const net = gross - transportCost;
  return { gross, transportCost, net };
}

/** Convert a quantity + unit into kilograms for consistent research math (§53). */
export function toKg(quantity, unit) {
  const q = Number(quantity) || 0;
  switch (unit) {
    case "kg": return q;
    case "quintal": return q * 100;
    case "ton": return q * 1000;
    default: return q;
  }
}

export function formatETB(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return `${Math.round(amount).toLocaleString("en-US")} ETB`;
}
