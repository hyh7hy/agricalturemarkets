// js/offers.js
// All reads/writes to /offers and /savedOffers in Firebase Realtime
// Database. Client-side role/ownership checks here are for UX only —
// the real enforcement is in database.rules.json (see README §Security).

import { database, logAnalyticsEvent, auth } from "./firebase.js";
import {
  ref, push, set, get, update, query, orderByChild, limitToLast,
  serverTimestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { toKg } from "./calculations.js";

/** Create a new offer. `role` is "seller" (farmer) or "buyer". */
export async function createOffer(ownerId, ownerRole, data) {
  const offersRef = ref(database, "offers");
  const newRef = push(offersRef);
  const quantityKg = toKg(data.quantity, data.unit);
  const payload = {
    ownerId,
    ownerRole,
    productId: data.productId,
    productName: data.productName,
    category: data.category,
    quantity: Number(data.quantity),
    unit: data.unit,
    quantityKg,
    pricePerKg: Number(data.pricePerKg),
    priceType: data.priceType, // "fixed" | "negotiable"
    region: data.region,
    zone: data.zone,
    city: data.city,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    description: sanitizeText(data.description || ""),
    quality: sanitizeText(data.quality || ""),
    harvestInfo: sanitizeText(data.harvestInfo || ""),
    preferredContact: data.preferredContact || "phone",
    availabilityDate: data.availabilityDate || null,
    validUntil: data.validUntil || null,
    reportedTransportCost: data.reportedTransportCost != null ? Number(data.reportedTransportCost) : null,
    status: "active",
    isDemo: false,
    views: 0,
    phoneReveals: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await set(newRef, payload);
  logAnalyticsEvent("post_offer", { category: data.category });
  return newRef.key;
}

export async function updateOffer(offerId, patch) {
  // Research-integrity note (README §38): editing an offer updates the
  // live listing but should not silently rewrite the historical record
  // used for research export. In this V1 the raw offer row is updated in
  // place; a fuller implementation would append a snapshot to
  // /offerHistory/{offerId}/{timestamp} before applying the patch.
  await update(ref(database, `offers/${offerId}`), { ...patch, updatedAt: serverTimestamp() });
}

export async function setOfferStatus(offerId, status) {
  await updateOffer(offerId, { status });
}

/** Soft-delete: keep the research record, remove from marketplace views. */
export async function deleteOffer(offerId) {
  await updateOffer(offerId, { status: "deleted" });
}

export async function getOffer(offerId) {
  const snap = await get(ref(database, `offers/${offerId}`));
  return snap.exists() ? { id: offerId, ...snap.val() } : null;
}

/** Fetch recent offers (bounded — never pull the whole table). */
export async function listRecentOffers(max = 200) {
  const q = query(ref(database, "offers"), orderByChild("createdAt"), limitToLast(max));
  const snap = await get(q);
  if (!snap.exists()) return [];
  const out = [];
  snap.forEach(child => out.push({ id: child.key, ...child.val() }));
  return out.reverse();
}

export async function listOffersByOwner(ownerId) {
  const all = await listRecentOffers(500);
  return all.filter(o => o.ownerId === ownerId && o.status !== "deleted");
}

/** Increment the view counter at most once per browser session per offer. */
export async function recordView(offerId) {
  const key = `viewed:${offerId}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  await runTransaction(ref(database, `offers/${offerId}/views`), (v) => (v || 0) + 1);
  logAnalyticsEvent("view_offer", { offer_id: offerId });
}

export async function recordPhoneReveal(offerId) {
  await runTransaction(ref(database, `offers/${offerId}/phoneReveals`), (v) => (v || 0) + 1);
  logAnalyticsEvent("phone_reveal", { offer_id: offerId });
}

export function trackCallClick(offerId) {
  logAnalyticsEvent("call_click", { offer_id: offerId });
}

// ---------- saved offers ----------
export async function toggleSaveOffer(uid, offerId) {
  const r = ref(database, `savedOffers/${uid}/${offerId}`);
  const snap = await get(r);
  if (snap.exists()) {
    await set(r, null);
    return false;
  }
  await set(r, true);
  logAnalyticsEvent("save_offer", { offer_id: offerId });
  return true;
}

export async function getSavedOfferIds(uid) {
  const snap = await get(ref(database, `savedOffers/${uid}`));
  return snap.exists() ? Object.keys(snap.val()) : [];
}

// ---------- support messages ----------
export async function submitSupportMessage(data) {
  const r = push(ref(database, "supportMessages"));
  await set(r, {
    ...data,
    userId: auth.currentUser?.uid || null,
    createdAt: serverTimestamp()
  });
}

// ---------- helpers ----------
function sanitizeText(str) {
  // Strip tags before storing; the UI also always renders user text via
  // textContent (never innerHTML) so this is defense-in-depth, not the
  // only safeguard.
  return String(str).replace(/<[^>]*>/g, "").slice(0, 2000);
}
