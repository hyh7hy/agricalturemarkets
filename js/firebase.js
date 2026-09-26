// js/firebase.js
// Single Firebase initialization point. Every other module imports
// auth / database / analytics from here rather than calling
// initializeApp() again.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import {
  getAnalytics,
  logEvent as fbLogEvent,
  isSupported as analyticsIsSupported
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCayGcfnpCAGNDph3YTyEA9_KDdD2C5Fg0",
  authDomain: "my-tiktok-cbd6f.firebaseapp.com",
  databaseURL: "https://my-tiktok-cbd6f-default-rtdb.firebaseio.com",
  projectId: "my-tiktok-cbd6f",
  storageBucket: "my-tiktok-cbd6f.firebasestorage.app",
  messagingSenderId: "964441294320",
  appId: "1:964441294320:web:4c8da74a0cee8ed2644935",
  measurementId: "G-RYBWW6XB10"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);

// Keep users signed in across visits.
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* non-fatal: falls back to session persistence */
});

// Analytics only initializes in supported browser contexts (not every
// dev/preview environment supports it), so guard it.
let _analytics = null;
analyticsIsSupported().then((ok) => {
  if (ok) _analytics = getAnalytics(app);
}).catch(() => {});

/**
 * Fire-and-forget analytics event logger. Never throws, never blocks
 * the calling code, and never receives personally identifying fields
 * (see README "Analytics" section for the allowed parameter list).
 */
export function logAnalyticsEvent(name, params = {}) {
  try {
    if (_analytics) fbLogEvent(_analytics, name, params);
  } catch (e) {
    /* analytics failures must never break the app */
  }
}
