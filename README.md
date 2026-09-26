# AgriMarket

**Connect. Compare. Sell.**
Find better agricultural market opportunities near you.

AgriMarket is an Ethiopian agricultural marketplace connecting smallholder
farmers/sellers with buyers. Its distinctive feature: it turns
**price + quantity + location + transportation cost** into an
**estimated net return**, so the highest advertised price isn't assumed
to be the best deal. It also doubles as a structured data-collection tool
for the research study *"Do Smallholder Farmers Choose the Most
Profitable Buyer? The Role of Transportation Costs in Agricultural Market
Decisions."*

This is a real, working V1 — no mock backend. Every offer, user profile,
save, view count, phone reveal, and support message is read from and
written to Firebase.

---

## 1. What's included vs. scoped out of V1

Per the project's own principle of not overloading V1, this build covers
phases 1–17 of the spec in full working order:

- Firebase email/password + Google auth, with profile-completion flow
- Farmer/Seller and Buyer roles, role-aware home feed
- Ethiopian location picker (Region → Zone → City) + GPS fallback
- Product catalog (7 categories, 31 products) with placeholder images
- Multi-step Post Offer flow with preview → publish
- Marketplace search, category filter, price/distance/type filters, sort
- Haversine straight-line distance, clearly labeled as approximate
- Net-return calculator (`NR = P×Q − T`) shown on cards, detail pages,
  and buyer/seller comparison lists
- Offer detail page with view counter, phone-reveal-on-tap, tel: call
- My Offers dashboard (stats, edit status, pause, mark sold, delete)
- Saved offers, Support page + contact form, Profile page
- Basic admin dashboard: aggregated metrics + anonymized CSV research
  export, gated behind a Firebase custom claim
- Firebase Analytics event logging (§60)
- Realtime Database security rules (`database.rules.json`)

**Deliberately left as architecture-ready stubs**, per §74 ("do not
overload V1 with unnecessary features") — each is a short follow-up
project, not a missing file:

- **Push notifications / in-app notification feed** — the 🔔 icon exists
  in the header but isn't wired to a `/notifications` node yet.
- **Amharic / Afaan Oromo** — `js/products.js`-style centralization is
  followed throughout, so adding a `translations.js` object and a
  language switcher is mechanical, but only English strings ship in V1.
- **Road-distance routing, transport marketplace, chat, payments,
  ratings, AI matching, price forecasting, SMS** — intentionally out of
  scope, as instructed.
- **Server-side view/phone-reveal counters** — the client increments
  `views`/`phoneReveals` via a Realtime Database transaction guarded by
  security rules that only allow the number to increase. This resists
  casual tampering but not a determined attacker with modified client
  code. For tamper-proof counters, add a Cloud Function that increments
  these fields instead of allowing client writes at all — see §7 below.
- **Historical snapshots on offer edit** — `updateOffer()` in
  `js/offers.js` has a comment marking exactly where to add
  `/offerHistory/{offerId}/{timestamp}` snapshotting if your research
  design needs edit-proof historical records.

---

## 2. Project structure

```
agrimarket/
├── index.html          Home / marketplace (role-aware)
├── login.html
├── signup.html          Multi-step signup + Google profile completion
├── post-offer.html      Multi-step offer creation
├── offer.html           Offer detail + comparison + phone reveal
├── my-offers.html       Seller/buyer dashboard
├── saved.html
├── support.html
├── profile.html
├── admin.html            Custom-claim gated
├── css/  main.css · auth.css · marketplace.css · dashboard.css
├── js/
│   ├── firebase.js       Single Firebase init point
│   ├── auth.js           Sign up/in, Google, reset, auth-state gate
│   ├── products.js       Product + category catalog
│   ├── locations.js      Region → Zone → City dataset
│   ├── calculations.js   Haversine distance, net-return formula
│   ├── offers.js         Offer CRUD, views, phone reveals, saved offers
│   ├── admin.js          Custom-claim check, aggregation, CSV export
│   └── app.js             Toasts, modals, geolocation helper, debounce
├── images/products/       Drop product photos here (see its README.txt)
├── firebase.json
├── database.rules.json
└── README.md
```

---

## 3. Install & run locally

No build step or npm dependencies are required — every Firebase import
is loaded from the official `gstatic.com` CDN as an ES module. You only
need a static file server (browsers block `fetch`/modules from `file://`
URLs):

```bash
cd agrimarket
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

---

## 4. Configure Firebase

The app already points at the project given in the brief
(`my-tiktok-cbd6f`) via `js/firebase.js`. To use your own project instead,
replace the `firebaseConfig` object at the top of that file with your
project's values from **Firebase Console → Project settings → General →
Your apps → SDK setup and configuration**.

### 4a. Enable Authentication methods
Firebase Console → **Build → Authentication → Sign-in method**:
1. Enable **Email/Password**.
2. Enable **Google**, and set a support email.
3. Under **Authentication → Settings → Authorized domains**, add your
   hosting domain (localhost is included by default).

### 4b. Enable the Realtime Database
Firebase Console → **Build → Realtime Database → Create database**.
Choose a region close to your users, start in locked mode (the rules
file in this repo will be deployed over the default rules in the next
step).

### 4c. Deploy security rules
```bash
firebase login
firebase use my-tiktok-cbd6f   # or your project id
firebase deploy --only database
```
This publishes `database.rules.json`. Never leave the database on
`{ ".read": true, ".write": true }` — the shipped rules already avoid
that (see §7 for what they enforce).

### 4d. Enable Analytics
Firebase Console → **Project settings → Integrations → Google
Analytics**, link or create a Google Analytics property. No code changes
are needed — `js/firebase.js` initializes Analytics automatically when
the browser supports it.

---

## 5. Deploy to Firebase Hosting

```bash
firebase login
firebase init hosting   # if you haven't already; point "public" at this folder
firebase deploy --only hosting
```
`firebase.json` in this repo already configures hosting to serve the
project root and cache product images. `firebase deploy` (no flags)
deploys both hosting and database rules together.

---

## 6. Create an admin account

**Do not** gate admin access by checking `auth.currentUser.email` against
a hardcoded address — that's client-side and trivially bypassable.
`admin.html` checks a **Firebase custom claim** (`admin: true`) on the
user's ID token instead, and `database.rules.json` uses
`auth.token.admin === true` to protect admin-only reads (support
messages, `/adminOnly`). Client code can never set its own custom
claims — only the Admin SDK, run from a trusted server or Cloud
Function, can:

```js
// Run once from a trusted environment (Cloud Function, local Node
// script with a service-account key, or `firebase functions:shell`) —
// NEVER ship a service-account key in the frontend.
const admin = require("firebase-admin");
admin.initializeApp();
await admin.auth().setCustomUserClaims(UID_OF_ADMIN_USER, { admin: true });
```

The user must sign out and back in (or call `getIdToken(true)`) for the
new claim to appear in their token.

---

## 7. How the security model works

- **Offers**: any signed-in user can create an offer; a user can only
  write to an offer whose `ownerId` matches their own `auth.uid` (or if
  they hold the `admin` claim). `ownerId` itself is validated so it can
  never be changed to someone else's UID.
- **Users**: a profile is only writable by its own owner.
- **views / phoneReveals**: writable by any signed-in user, but the rule
  requires the new value to be `>=` the existing value, so a client can
  increment but not zero out or fabricate a huge drop. This is
  reasonable for a V1 but is not abuse-proof — a production system
  should move counter writes into a Cloud Function that validates one
  increment per (user, offer) pair server-side.
- **supportMessages**: any signed-in user can submit one; only admins
  can read the list.
- **Public marketplace reads**: `/offers` is publicly readable (so
  logged-out visitors can browse, per §63) but a user's private phone
  number lives on their `/users/{uid}` profile, which requires
  authentication to read — the offer detail page's "Show phone number"
  button fetches it only after the person explicitly taps it, and only
  a signed-in session can read it at all.

---

## 8. Adding products & images

Add one object to the `PRODUCTS` array in `js/products.js`:
```js
{ id: "millet", name: "Millet", category: "cereals" }
```
`image` is derived automatically as `/images/products/millet.jpg`. Drop
a matching JPG into `images/products/`; until you do, the UI shows a
generated category-colored placeholder instead of a broken image icon.

---

## 9. How location & distance work

Users can either tap **"Use my current location"** (browser Geolocation
API — if permission is denied, the app never breaks, it just falls back
to the manual picker) or choose **Region → Zone → City** from the
dataset in `js/locations.js`. That dataset is a representative subset of
Ethiopia's admin hierarchy with real approximate town coordinates —
extend the same object shape to add more zones/towns.

Distance shown everywhere ("14 km away", "850 m away") is calculated
with the **Haversine formula** — straight-line distance, not road
distance — and is always labeled "Approx." / "straight-line" per the
brief's instruction not to imply road routing.

---

## 10. How the net-return calculation works

```
Net Return = (Price per kg × Quantity in kg) − Transportation Cost
```
implemented in `js/calculations.js` as `calcNetReturn()`. Transportation
cost is **never silently assumed to equal distance**:
- If the offer owner entered their own transport estimate when posting,
  that figure is used and labeled "Reported transportation."
- Otherwise, a clearly-labeled placeholder rate
  (`DEFAULT_TRANSPORT_RATE_ETB_PER_KM`, editable in one place) is
  applied to the Haversine distance and labeled "Estimated
  transportation (@ N ETB/km)."

Every place net return is shown includes the line *"Estimated using the
information provided. Actual transportation and transaction costs may
differ."*

---

## 11. Research data export

`admin.html` → **Export offers as CSV** produces a file with the columns
`participant_id, role, product, quantity_kg, advertised_price_etb_per_kg,
price_type, city, distance_km, transport_cost_etb, transport_source,
calculated_net_return_etb, status, timestamp`. Owner UIDs are replaced
with short anonymous codes (`P1`, `P2`, …) generated per export; raw
phone numbers and names are never included. `distance_km` and
`calculated_net_return_etb` are left blank in the export because they
depend on the *viewer's* location at calculation time — compute them in
your analysis pipeline from `latitude`/`longitude` using the same
Haversine formula in `js/calculations.js`, so every researcher applies
an identical, transparent method.

---

## 12. Analytics events

Logged via `logAnalyticsEvent()` in `js/firebase.js`, with no personal
data in event parameters: `sign_up`, `login`, `view_offer`, `post_offer`,
`phone_reveal`, `call_click`, `save_offer`.

---

## 13. Demo / seed data

No fabricated offers, users, or statistics ship in this repo — the
marketplace is empty until real accounts post real offers, per the
project's research-integrity requirement (§73). If you want sample data
for UI testing, write a small seed script that calls `createOffer()`
with `isDemo: true`; `index.html` already renders a **DEMO DATA** badge
on any offer with that flag, and the admin CSV export should filter
`isDemo` rows out before treating a dataset as real research data.
