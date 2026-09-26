// js/auth.js
// Wraps Firebase Authentication + the /users/{uid} profile record.
// Friendly error messages only — raw Firebase error codes are never
// shown to the end user (see README "Error handling").

import { auth, googleProvider, database, logAnalyticsEvent } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  ref, set, get, update, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const FRIENDLY_ERRORS = {
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Please choose a stronger password (at least 6 characters).",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/network-request-failed": "We couldn't connect. Please check your internet connection and try again.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again."
};

export function friendlyAuthError(err) {
  return FRIENDLY_ERRORS[err?.code] || "Something went wrong. Please try again.";
}

/** Create an account with email/password and write the initial profile. */
export async function signUpWithEmail({ name, phone, email, password, role, location }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await writeUserProfile(cred.user.uid, {
    name, phone, email, role,
    ...location,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  logAnalyticsEvent("sign_up", { method: "email", role });
  return cred.user;
}

export async function logInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  logAnalyticsEvent("login", { method: "email" });
  return cred.user;
}

/** Google sign-in. Returns { user, isNewProfile } so the caller can route
 *  first-time users to the profile-completion step. */
export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const existing = await getUserProfile(cred.user.uid);
  logAnalyticsEvent(existing ? "login" : "sign_up", { method: "google" });
  return { user: cred.user, isNewProfile: !existing };
}

export async function completeGoogleProfile(uid, { phone, role, location }) {
  const user = auth.currentUser;
  await writeUserProfile(uid, {
    name: user?.displayName || "",
    email: user?.email || "",
    phone, role, ...location,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function logOut() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

async function writeUserProfile(uid, data) {
  await set(ref(database, `users/${uid}`), data);
}

export async function getUserProfile(uid) {
  const snap = await get(ref(database, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
}

export async function updateUserProfile(uid, patch) {
  await update(ref(database, `users/${uid}`), { ...patch, updatedAt: serverTimestamp() });
}

/**
 * Central auth-state gate used by every page.
 * Calls back with { user, profile } once resolved, or { user: null } if
 * signed out. `profile` is null if the user is authenticated but hasn't
 * finished onboarding (e.g. mid-way through Google sign-in) — pages
 * should redirect such users to signup.html#complete-profile.
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return callback({ user: null, profile: null });
    const profile = await getUserProfile(user.uid).catch(() => null);
    callback({ user, profile });
  });
}

/** Convenience guard for pages that require sign-in + a complete profile. */
export function requireAuth({ onReady, onSignedOut, onIncompleteProfile }) {
  return watchAuthState(({ user, profile }) => {
    if (!user) return onSignedOut?.();
    if (!profile) return onIncompleteProfile?.(user);
    onReady?.(user, profile);
  });
}
