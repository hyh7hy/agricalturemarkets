// js/app.js
// Small shared UI utilities used across every page: toasts, nav
// highlighting, a generic bottom-sheet modal, debounce, and the
// geolocation flow (with graceful manual-location fallback per §10).

export function toast(message, type = "info") {
  let region = document.getElementById("toast-region");
  if (!region) {
    region = document.createElement("div");
    region.id = "toast-region";
    document.body.appendChild(region);
  }
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "error" : ""}`;
  el.textContent = message;
  region.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

export function highlightActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-link]").forEach(a => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
}

export function debounce(fn, wait = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
export function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-modal]")) {
    e.target.closest(".modal-backdrop")?.classList.remove("open");
  }
});

export function skeletonCards(container, count = 8) {
  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="offer-card">
      <div class="skeleton" style="aspect-ratio:4/3"></div>
      <div class="body">
        <div class="skeleton" style="height:14px;width:70%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:18px;width:50%;margin-bottom:8px"></div>
        <div class="skeleton" style="height:12px;width:90%"></div>
      </div>
    </div>`).join("");
}

/**
 * Attempts browser geolocation. Resolves { lat, lng } on success, or
 * null on denial/failure/unsupported — callers must always handle the
 * null case by falling back to manual location selection (§10, §34).
 */
export function getBrowserLocation({ timeout = 8000 } = {}) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout, enableHighAccuracy: false }
    );
  });
}

export function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = String(str ?? "");
  return d.innerHTML;
}

/** Reads the app's "current location" from localStorage (set at
 *  onboarding or via the location bar). Never throws. */
export function getStoredLocation() {
  try {
    const raw = localStorage.getItem("agrimarket:location");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setStoredLocation(loc) {
  try { localStorage.setItem("agrimarket:location", JSON.stringify(loc)); } catch {}
}

highlightActiveNav();
