// js/products.js
// Central product catalog. Add a new product by adding one object here —
// nothing else in the app needs to change. If /images/products/<id>.jpg
// does not exist, the UI falls back to a generated placeholder (see
// getProductImage below), so shipping real photos is optional for V1.

export const CATEGORIES = [
  { id: "cereals", name: "Cereals", emoji: "🌾" },
  { id: "pulses", name: "Pulses", emoji: "🫘" },
  { id: "oilseeds", name: "Oilseeds", emoji: "🌻" },
  { id: "cash_crops", name: "Cash crops", emoji: "☕" },
  { id: "vegetables", name: "Vegetables", emoji: "🥕" },
  { id: "fruits", name: "Fruits", emoji: "🍌" },
  { id: "other", name: "Other", emoji: "🌱" }
];

export const PRODUCTS = [
  // Cereals
  { id: "maize", name: "Maize", category: "cereals" },
  { id: "wheat", name: "Wheat", category: "cereals" },
  { id: "teff", name: "Teff", category: "cereals" },
  { id: "barley", name: "Barley", category: "cereals" },
  { id: "sorghum", name: "Sorghum", category: "cereals" },
  { id: "oats", name: "Oats", category: "cereals" },
  // Pulses
  { id: "beans", name: "Beans", category: "pulses" },
  { id: "lentils", name: "Lentils", category: "pulses" },
  { id: "chickpeas", name: "Chickpeas", category: "pulses" },
  { id: "peas", name: "Peas", category: "pulses" },
  { id: "faba_beans", name: "Faba beans", category: "pulses" },
  // Oilseeds
  { id: "sesame", name: "Sesame", category: "oilseeds" },
  { id: "niger_seed", name: "Niger seed", category: "oilseeds" },
  { id: "sunflower", name: "Sunflower", category: "oilseeds" },
  // Cash crops
  { id: "coffee", name: "Coffee", category: "cash_crops" },
  { id: "chat", name: "Chat", category: "cash_crops" },
  { id: "cotton", name: "Cotton", category: "cash_crops" },
  { id: "sugarcane", name: "Sugarcane", category: "cash_crops" },
  // Vegetables
  { id: "potato", name: "Potato", category: "vegetables" },
  { id: "onion", name: "Onion", category: "vegetables" },
  { id: "tomato", name: "Tomato", category: "vegetables" },
  { id: "cabbage", name: "Cabbage", category: "vegetables" },
  { id: "carrot", name: "Carrot", category: "vegetables" },
  { id: "garlic", name: "Garlic", category: "vegetables" },
  { id: "pepper", name: "Pepper", category: "vegetables" },
  // Fruits
  { id: "banana", name: "Banana", category: "fruits" },
  { id: "avocado", name: "Avocado", category: "fruits" },
  { id: "mango", name: "Mango", category: "fruits" },
  { id: "papaya", name: "Papaya", category: "fruits" },
  { id: "orange", name: "Orange", category: "fruits" },
  { id: "lemon", name: "Lemon", category: "fruits" }
].map(p => ({ ...p, image: `/images/products/${p.id}.jpg` }));

export function getProduct(id) {
  return PRODUCTS.find(p => p.id === id) || null;
}

export function getCategory(id) {
  return CATEGORIES.find(c => c.id === id) || null;
}

// A tiny inline SVG placeholder (data URI) so the marketplace never shows
// a broken image icon before real product photography is added.
const PLACEHOLDER_EMOJI = { cereals: "🌾", pulses: "🫘", oilseeds: "🌻", cash_crops: "☕", vegetables: "🥕", fruits: "🍌", other: "🌱" };

export function placeholderFor(product) {
  const emoji = PLACEHOLDER_EMOJI[product?.category] || "🌱";
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#eef2e6"/><text x="50%" y="52%" font-size="72" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`
  )}`;
}

// Used by <img onerror> to swap in the placeholder if the real photo 404s.
export function bindImageFallback(imgEl, product) {
  imgEl.addEventListener("error", () => {
    imgEl.onerror = null;
    imgEl.src = placeholderFor(product);
  }, { once: true });
}
