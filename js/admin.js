// js/admin.js
// Admin authorization is based on a Firebase custom claim ("admin": true)
// set on the user's ID token — NOT on checking the signed-in email
// against a hardcoded string (see README "Creating an admin"). The
// client-side check below is for UI gating only; the database rules
// (database.rules.json) are what actually restrict admin-only paths.

import { auth, database } from "./firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

export async function isAdmin(user) {
  if (!user) return false;
  try {
    const token = await user.getIdTokenResult();
    return token.claims?.admin === true;
  } catch {
    return false;
  }
}

export async function fetchAdminOverview() {
  const [usersSnap, offersSnap, supportSnap] = await Promise.all([
    get(ref(database, "users")),
    get(ref(database, "offers")),
    get(ref(database, "supportMessages"))
  ]);
  const users = usersSnap.exists() ? Object.values(usersSnap.val()) : [];
  const offers = offersSnap.exists() ? Object.entries(offersSnap.val()).map(([id, o]) => ({ id, ...o })) : [];
  const support = supportSnap.exists() ? Object.entries(supportSnap.val()).map(([id, m]) => ({ id, ...m })) : [];

  const farmers = users.filter(u => u.role === "seller").length;
  const buyers = users.filter(u => u.role === "buyer").length;
  const activeOffers = offers.filter(o => o.status === "active");
  const avgPrice = avg(offers.map(o => o.pricePerKg));
  const totalViews = offers.reduce((s, o) => s + (o.views || 0), 0);
  const totalReveals = offers.reduce((s, o) => s + (o.phoneReveals || 0), 0);

  return { users, offers, support, farmers, buyers, activeOffers, avgPrice, totalViews, totalReveals };
}

function avg(arr) {
  const nums = arr.filter(n => typeof n === "number" && !Number.isNaN(n));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/** Builds a research-export CSV. Personal phone numbers are intentionally
 *  excluded (§39) and owner IDs are replaced with short anonymous
 *  participant codes rather than raw Firebase UIDs. */
export function buildResearchCsv(offers) {
  const participantMap = new Map();
  function participantId(uid) {
    if (!participantMap.has(uid)) participantMap.set(uid, `P${participantMap.size + 1}`);
    return participantMap.get(uid);
  }
  const header = [
    "participant_id","role","product","quantity_kg","advertised_price_etb_per_kg",
    "price_type","city","distance_km","transport_cost_etb","transport_source",
    "calculated_net_return_etb","status","timestamp"
  ];
  const rows = offers.map(o => [
    participantId(o.ownerId), o.ownerRole, o.productName, o.quantityKg, o.pricePerKg,
    o.priceType, o.city || "", "", o.reportedTransportCost ?? "",
    o.reportedTransportCost != null ? "user_reported" : "not_reported",
    "", o.status, o.createdAt || ""
  ]);
  return [header, ...rows].map(r => r.map(csvEscape).join(",")).join("\n");
}
function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
