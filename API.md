# Multi-Vendor Marketplace Backend — API Reference

Status: Phase 1 (Foundation), Phase 2 (Auth & RBAC), Phase 3 (Multi-vendor order logic)
complete. Phase 4 (Payments) is **in progress** — Stripe setup + schema (4.1), the
restructured checkout flow (4.2), and the webhook that confirms/fails a payment (4.3) are
all done and tested. What's still missing: the actual frontend payment form (Stripe
Elements, 4.4) and full end-to-end testing via the real Stripe CLI (4.5) — until 4.4
exists, there's no way for a real browser checkout to ever actually confirm a payment
(the `clientSecret` from `POST /api/orders` has nowhere to go yet). No `Review` endpoints
exist yet (Phase 5).

This document is written for building a frontend client (e.g. Next.js) against the API
as it exists right now. It reflects only what is actually implemented and tested.

---

## 0. About this project

This is a backend-focused learning project: a small multi-vendor marketplace (think a
mini Daraz/Etsy) with **Buyers**, **Sellers**, **Admins**, **Products**, and — in later
phases — **Orders**, **Payments**, and **Reviews**. The backend is deliberately being
built in stages of increasing complexity (plain Express before Nest.js, Stripe test mode
before local payment gateways, etc.) so that when something breaks, it's clear which layer
broke — full reasoning lives in `CLAUDE.md` at the project root.

**Why "multi-vendor" instead of a single-seller store:** a single seller barely touches
real backend complexity. Multiple sellers force genuine problems to solve — role-based
access control, per-seller ownership checks, and (starting in Phase 3) splitting one
buyer's order across several sellers' inventories.

**Stack:** Node.js + Express + TypeScript, PostgreSQL + Prisma ORM, JWT access/refresh
auth with `BUYER`/`SELLER`/`ADMIN` roles. A Next.js frontend is the next thing being built
— initially just as a way to exercise these endpoints by hand, rather than a full product
build.

**Where things stand:** Phase 1 (Foundation — schema + layered CRUD pattern), Phase 2
(Auth & RBAC — JWT, refresh tokens, role enforcement), and Phase 3 (multi-vendor order
logic — checkout, buyer/seller order views, fulfillment status, concurrency-safe stock)
are all complete and manually tested against their permission boundaries, including a
real concurrency stress test (8 simultaneous checkout requests against a single unit of
stock — exactly one succeeded, never oversold). Phase 4 (payments) is partway done — see
the status line above. Phase 5 (reviews/search) and Phase 6 (production hardening) haven't
started yet.

---

## 1. Base setup

- **Base URL (dev):** `http://localhost:5000`
- **Content type:** all request bodies are `application/json`
- **CORS:** the API only accepts credentialed cross-origin requests from the origin set in
  `CORS_ORIGIN` (defaults to `http://localhost:3000` if unset). Any frontend fetch/axios call
  that needs the refresh-token cookie **must** send `credentials: 'include'` (fetch) or
  `withCredentials: true` (axios), or the browser will silently drop the cookie.

### Error response shape

Every error (validation, auth, not-found, conflict, server) returns the same shape:

```json
{ "message": "human-readable message" }
```

with the appropriate HTTP status code (400/401/403/404/409/500). Validation errors (400)
concatenate all Zod issue messages with `", "`.

### Roles

```
BUYER | SELLER | ADMIN
```

`ADMIN` can never be self-assigned through any public endpoint — it must be set by another
`ADMIN` via `PUT /api/users/:id`, or directly in the database (there is currently no seed
script; the first admin was created by manually promoting a row via SQL).

---

## 2. Authentication flow

### How tokens work

- **Access token** — a JWT, returned in the JSON body on register/login/refresh. Lives
  15 minutes by default (`JWT_ACCESS_EXPIRES_IN`). Store it in memory on the frontend
  (a variable / Zustand store) — **never** `localStorage`, since anything JS-readable is
  vulnerable to theft via XSS. Send it as `Authorization: Bearer <token>` on every request
  to a protected route.
- **Refresh token** — a random opaque string, stored server-side in the `RefreshToken`
  table, delivered as an `httpOnly` cookie named `refresh_token`, scoped to path
  `/api/auth` (so it's only ever sent back on `/api/auth/*` requests, not on every API call).
  JavaScript cannot read this cookie — the browser manages it automatically. Lives 7 days
  (`REFRESH_TOKEN_EXPIRES_DAYS`).

### The full login → expiry → refresh story

1. User logs in → gets `accessToken` (keep in memory) + `refresh_token` cookie (browser
   stores it, invisible to JS).
2. Frontend calls protected routes with `Authorization: Bearer <accessToken>`.
3. After 15 minutes, the access token expires. The next protected-route call returns
   `401 { "message": "Not authorized — token is invalid or expired" }`.
4. Frontend's HTTP client should catch this 401, call `POST /api/auth/refresh`
   (**with credentials included** — the cookie rides along automatically, no manual
   attachment needed), get a new `accessToken`, then retry the original request.
5. If `/api/auth/refresh` itself returns 401, the refresh token is invalid/expired too —
   this is a real logout: clear the in-memory access token and redirect to login.
6. **Build these interceptor guards on the frontend:**
   - Don't attempt a refresh-triggered-retry loop on `/api/auth/login` or
     `/api/auth/refresh` themselves (avoids infinite loops).
   - If multiple requests 401 at once, only fire one `/refresh` call and queue the rest
     behind it, rather than firing a refresh per failed request.

### Important gotcha

Role changes (e.g. an admin promoting a user) do **not** retroactively affect an
already-issued access token — JWTs are self-contained and nothing re-checks the database
per request. The new role only takes effect after the user's current token expires
(≤ 15 min) or they log in again.

---

## 3. Auth endpoints (`/api/auth`)

All auth endpoints are rate-limited: **10 requests / 15 minutes** on `/register` and
`/login` (`429` with `{ "message": "Too many attempts, please try again later." }` past
that).

### `POST /api/auth/register`

Public. Creates a `BUYER` or `SELLER` account (never `ADMIN`).

**Body:**
```json
{
  "name": "Alice Seller",
  "email": "alice@example.com",
  "password": "password123",
  "role": "SELLER"
}
```
- `name`: string, 2–100 chars
- `email`: valid email, must be unique
- `password`: string, min 8 chars
- `role`: optional, `"BUYER"` (default) or `"SELLER"` only — `"ADMIN"` is rejected by
  validation (400) before it ever reaches the database

**Success — `201`:**
```json
{
  "user": {
    "id": "cmrs...", "name": "Alice Seller", "email": "alice@example.com",
    "role": "SELLER", "createdAt": "...", "updatedAt": "..."
  },
  "accessToken": "eyJhbGciOi..."
}
```
Also sets the `refresh_token` cookie.

**Failure cases:** `409` email already registered · `400` validation (weak password,
invalid email, `role: "ADMIN"`, etc.)

### `POST /api/auth/login`

Public.

**Body:** `{ "email": "...", "password": "..." }`

**Success — `200`:** same shape as register (`user`, `accessToken`) + sets `refresh_token`
cookie.

**Failure:** `401 { "message": "Invalid credentials" }` for both wrong email and wrong
password (deliberately identical message — doesn't reveal which one was wrong, or whether
the email exists at all).

### `POST /api/auth/refresh`

Requires the `refresh_token` cookie (sent automatically by the browser if
`credentials: 'include'` is used and the request goes to this API's origin).

**Body:** none.

**Success — `200`:** `{ "accessToken": "eyJhbGciOi..." }`

**Failure — `401`:** missing cookie / token not found in DB / token expired (also deletes
the expired row) / user no longer exists.

### `POST /api/auth/logout`

**Body:** none. Reads the `refresh_token` cookie, deletes that row from the DB (if
present — this is idempotent, no error if it's already gone), clears the cookie.

**Success — `200`:** `{ "message": "Logged out successfully" }`

---

## 4. User endpoints (`/api/users`)

All routes require `Authorization: Bearer <accessToken>`.

| Method | Path | Who | Behavior |
|---|---|---|---|
| GET | `/api/users` | `ADMIN` only | List all users (password never included) |
| GET | `/api/users/:id` | account owner or `ADMIN` | View one user |
| PUT | `/api/users/:id` | account owner or `ADMIN` | Update `name`/`email`; `role` field only accepted if requester is `ADMIN` |
| DELETE | `/api/users/:id` | `ADMIN` only | Delete a user |

### `GET /api/users`
`403` for any non-`ADMIN` caller. `200` → array of `{ id, name, email, role, createdAt, updatedAt }` (no `password` field, ever).

### `GET /api/users/:id`
`403` if caller is neither the account owner nor `ADMIN`. `404` if the id doesn't exist. `200` → single user object (same shape as above).

### `PUT /api/users/:id`
**Body (all optional, at least one required):**
```json
{ "name": "New Name", "email": "new@example.com", "role": "SELLER" }
```
- `403` if caller is neither the account owner nor `ADMIN`.
- `403` `{ "message": "Only admins can change a user's role" }` if `role` is present in the
  body and the caller isn't `ADMIN` — **even when editing their own account**. This is the
  concrete block against self-privilege-escalation.
- `409` if the new `email` collides with an existing user.
- `200` → updated user object.

### `DELETE /api/users/:id`
`403` if caller isn't `ADMIN`. `404` if not found. `204` (empty body) on success.

---

## 5. Category endpoints (`/api/categories`)

| Method | Path | Who |
|---|---|---|
| GET | `/api/categories` | Public |
| GET | `/api/categories/:id` | Public |
| POST | `/api/categories` | `ADMIN` only |
| PUT | `/api/categories/:id` | `ADMIN` only |
| DELETE | `/api/categories/:id` | `ADMIN` only |

### `GET /api/categories`
No auth needed. `200` → array of `{ id, name, createdAt }`.

### `GET /api/categories/:id`
No auth needed. `404` if not found, else `200` → single category.

### `POST /api/categories`
**Body:** `{ "name": "Electronics" }` (non-empty string required, 400 if missing/blank)
`401` no/invalid token · `403` non-`ADMIN` · `409` duplicate name · `201` on success.

### `PUT /api/categories/:id`
Same body/auth rules as `POST`. `404` if the category doesn't exist. `200` on success.

### `DELETE /api/categories/:id`
`401`/`403` same as above. `404` if not found. **`409`** if the category still has products
referencing it (`{ "message": "Cannot delete category that still has products" }`).
`204` on success.

---

## 6. Product endpoints (`/api/products`)

| Method | Path | Who |
|---|---|---|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | `SELLER` only |
| PUT | `/api/products/:id` | product owner or `ADMIN` |
| DELETE | `/api/products/:id` | product owner or `ADMIN` |

### `GET /api/products` / `GET /api/products/:id`
No auth needed. Product shape:
```json
{
  "id": "...", "name": "...", "description": "...",
  "price": "999.99", "stock": 5,
  "sellerId": "...", "categoryId": "...",
  "createdAt": "...", "updatedAt": "..."
}
```
Note: `price` is serialized as a **string** (it's a Prisma `Decimal`) — parse it on the
frontend before doing arithmetic, don't treat it as a JS `number` directly.

### `POST /api/products`
Requires `Authorization: Bearer <token>` for a `SELLER` account. `403` for `BUYER`/`ADMIN`
callers (only `SELLER` can create — an `ADMIN` cannot create products on a seller's behalf
in the current implementation).

**Body:**
```json
{
  "name": "Laptop", "description": "A laptop",
  "price": 999.99, "stock": 5, "categoryId": "cmrs..."
}
```
- `name`: 2–150 chars · `description`: non-empty · `price`: positive number ·
  `stock`: non-negative integer, defaults to 0 · `categoryId`: required, must reference a
  real `Category`
- **`sellerId` is never accepted from the client** — it isn't part of this schema at all,
  so any `sellerId` sent in the body is silently stripped before it reaches the service.
  The real `sellerId` always comes from the authenticated user's own id.
- `400` if `categoryId` doesn't exist (`"Invalid categoryId — category does not exist"`).
- `201` on success.

### `PUT /api/products/:id`
**Body:** any subset of `{ name, description, price, stock, categoryId }` (at least one
field required). `sellerId` can never be changed through this endpoint.
- `403` if caller is neither the product's seller nor `ADMIN`.
- `404` if the product doesn't exist.
- `400` if the new `categoryId` doesn't exist.
- `200` on success.

### `DELETE /api/products/:id`
`403` if caller is neither the product's seller nor `ADMIN`. `404` if not found. `204` on
success.

---

## 7. Order endpoints (`/api/orders`)

This is the multi-vendor core of the API. A single checkout can contain products from
several different sellers — each seller only ever sees their own slice of that order (see
`GET /api/orders/seller-items` below), never the buyer's or other sellers' items.

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/orders` | any authenticated user | Place an order (checkout) |
| GET | `/api/orders` | any authenticated user | List your own orders (as buyer) |
| GET | `/api/orders/admin` | `ADMIN` only | List every order in the system |
| GET | `/api/orders/:id` | order's buyer or `ADMIN` | View one order + its items |
| GET | `/api/orders/seller-items` | `SELLER` only | List only the line items *you* sold |
| PATCH | `/api/orders/items/:id/status` | item's seller or `ADMIN` | Update one line item's fulfillment status |

Role note: unlike `Product`, checkout has **no role restriction** — `BUYER`, `SELLER`, and
`ADMIN` can all place an order. Role only governs what you can *manage* (list a product,
etc.), not what you can *buy*.

### `POST /api/orders` — checkout

**Body:**
```json
{
  "items": [
    { "productId": "cmrs...", "quantity": 2 },
    { "productId": "cmrs...", "quantity": 1 }
  ],
  "provider": "STRIPE"
}
```
- `items`: array, at least 1 entry · each `quantity`: positive integer
- `provider`: optional, `"STRIPE"` (default) or `"SSLCOMMERZ"` — **one endpoint handles
  both gateways**, not two separate checkout routes, since cart validation/stock
  reservation is identical either way.
- **`buyerId` and `sellerId` are never accepted from the client** — `buyerId` comes from
  `req.user.id`, `sellerId` on each line item comes from the product's actual owner at the
  time of purchase. Same "never trust the body for ownership fields" rule as `Product`.
- Stock and product existence are validated per line item **before** anything is written.
  If any single item is invalid, the whole checkout is rejected — nothing partial is ever
  created (backed by one Prisma transaction).

**⚠️ Response shape changed in Phase 4 (4.2)** — this endpoint used to return the order
object directly. It now returns `{ order, clientSecret }` (Stripe) or `{ order,
gatewayPageUrl }` (SSLCommerz) — **which key is present depends on which `provider` you
requested.** Update any existing frontend code that expected the bare order to unwrap
`.order` instead, and branch on `provider` to know which of `clientSecret`/`gatewayPageUrl`
to expect.

**⚠️ `payment.stripePaymentIntentId` was renamed to `payment.providerTransactionId`**, and a
new `payment.provider` field (`"STRIPE"` | `"SSLCOMMERZ"`) was added, as of Phase 4.6 —
generalizing `Payment` to support a second payment gateway.

**Success — `201`, `provider: "STRIPE"` (unchanged from before):**
```json
{
  "order": {
    "id": "cmrs...", "buyerId": "cmrs...", "status": "PLACED", "totalAmount": "96",
    "createdAt": "...", "updatedAt": "...",
    "items": [
      {
        "id": "cmrs...", "orderId": "cmrs...", "productId": "cmrs...", "sellerId": "cmrs...",
        "quantity": 2, "priceAtPurchase": "25.5", "status": "PENDING",
        "createdAt": "...", "updatedAt": "..."
      },
      { "...": "one entry per cart line, each with its own sellerId + priceAtPurchase" }
    ],
    "payment": {
      "id": "cmrs...", "orderId": "cmrs...", "provider": "STRIPE",
      "providerTransactionId": "pi_...",
      "amount": "96", "currency": "usd", "status": "PENDING",
      "createdAt": "...", "updatedAt": "..."
    }
  },
  "clientSecret": "pi_..._secret_..."
}
```

**Success — `201`, `provider: "SSLCOMMERZ"` (new in 4.6.2):**
```json
{
  "order": {
    "id": "cmrs...", "buyerId": "cmrs...", "status": "PLACED", "totalAmount": "96",
    "createdAt": "...", "updatedAt": "...",
    "items": [ "...same shape as above..." ],
    "payment": {
      "id": "cmrs...", "orderId": "cmrs...", "provider": "SSLCOMMERZ",
      "providerTransactionId": "a05a5526-...-uuid",
      "amount": "96", "currency": "BDT", "status": "PENDING",
      "createdAt": "...", "updatedAt": "..."
    }
  },
  "gatewayPageUrl": "https://sandbox.sslcommerz.com/EasyCheckOut/..."
}
```
Unlike Stripe, there is **no embedded card form** for SSLCommerz — the frontend must
**redirect the entire browser** to `gatewayPageUrl` (`window.location.href = ...`), not
render anything inline. The user completes payment on SSLCommerz's own hosted page, then
gets redirected back to one of three URLs the backend already configured when initiating
the session (not something the frontend passes in): success/fail/cancel pages under
`${FRONTEND_URL}/checkout/sslcommerz/{success,fail,cancel}`. **These three frontend routes
need to exist** (4.6.4) — SSLCommerz will redirect to them regardless.

**Known simplifications, worth knowing before building the frontend for this:**
- `currency: "BDT"` reuses the exact same numeric `totalAmount` as the `STRIPE` path would
  — there is **no real USD↔BDT conversion**. A ৳96 SSLCommerz charge and a $96 Stripe charge
  in this app currently represent the same underlying number, not equivalent real-world
  value. Out of scope for this integration.
- The backend currently sends placeholder customer address/phone to SSLCommerz (`User` has
  no such fields yet) — not something the frontend needs to supply, just noting it exists.

Note: `totalAmount`, `priceAtPurchase`, and `payment.amount` are serialized as **strings**
(Prisma `Decimal`), same caveat as `Product.price` — parse before doing arithmetic on the
frontend.

`priceAtPurchase` is a **snapshot** taken at checkout time — it will never change even if
the seller updates their product's price later. `totalAmount` is computed server-side from
real current prices; nothing about pricing is ever trusted from the request body.

**`clientSecret`** is what the frontend needs for Stripe Elements (coming in 4.4) to
actually collect card details and confirm the payment. It's returned once, here, and never
stored in our database — only Stripe and the current page session ever hold it.

**Stock is reserved (decremented) immediately at checkout**, before payment is confirmed —
this guarantees the item is actually available to the buyer who's paying for it right now.
The webhook (4.3) closes the loop: if the payment ultimately succeeds, `Payment.status`
becomes `SUCCEEDED` and nothing else changes; if it fails, stock is automatically restored
and `Order.status` becomes `CANCELLED`. Note this only resolves once Stripe actually sends
a definitive success/failure event — a checkout the buyer simply abandons without ever
submitting a card (no webhook event at all) will still leave `Payment.status: PENDING`
and stock decremented indefinitely; there's no timeout/expiry handling for that case yet.

**Failure cases:** `401` not logged in · `400` empty cart / bad shape · `404` a `productId`
doesn't exist · `409` insufficient stock for some item (`{ "message": "Insufficient stock
for product \"<name>\"" }`) — this can also fire from a genuine race condition against
another buyer checking out the same product simultaneously, verified under real concurrent
load (see `CLAUDE.md` 3.6) · `500` if the Stripe API call itself fails (e.g. invalid API
key) — no order or stock change occurs in this case, since the `PaymentIntent` is created
*before* the database transaction runs.

### `GET /api/orders` — your own order history

No params. `200` → array of your own orders (filtered server-side by `buyerId`, not
something you can bypass), each with nested `items`, newest first.

### `GET /api/orders/admin` — every order in the system

Requires `ADMIN` role — `403` otherwise. `200` → array of **all** orders across every
buyer, each with nested `items`, newest first. Unlike `GET /api/orders`, this one isn't
filtered by the caller's own identity at all — it exists specifically because the base
`/api/orders` route always means "my own orders," even for an admin, so there was
previously no way to browse orders without already knowing a specific order's ID.

### `GET /api/orders/:id`

`403` if you're neither this order's buyer nor `ADMIN`. `404` if it doesn't exist. `200` →
single order with nested `items` (same shape as the checkout response).

### `GET /api/orders/seller-items` — the "order splitting" view

Requires `SELLER` role. `200` → array of **only your own `OrderItem` rows**, across
however many different buyers' orders they came from:
```json
[
  {
    "id": "cmrs...", "orderId": "cmrs...", "productId": "cmrs...", "sellerId": "cmrs...",
    "quantity": 2, "priceAtPurchase": "25.5", "status": "PENDING",
    "createdAt": "...", "updatedAt": "...",
    "product": { "id": "cmrs...", "name": "Mouse" },
    "order": { "id": "cmrs...", "status": "PLACED", "buyerId": "cmrs...", "createdAt": "..." }
  }
]
```
Note the nested `order` object is deliberately minimal (`id`/`status`/`buyerId`/`createdAt`
only) — it does **not** include that order's full `items`, so you never see another
seller's line items even though they may share the same `orderId`.

### `PATCH /api/orders/items/:id/status` — update fulfillment status

**Body:** `{ "status": "SHIPPED" }` — one of `PENDING` / `SHIPPED` / `DELIVERED` /
`CANCELLED`.

Status changes follow a fixed state machine, enforced **regardless of role, including
`ADMIN`**:
```
PENDING ──▶ SHIPPED ──▶ DELIVERED   (terminal, no further changes)
   │            │
   ▼            ▼
CANCELLED   CANCELLED                (terminal, no further changes)
```
- `401` not logged in.
- `403` if you're neither this item's seller nor `ADMIN`.
- `400` `{ "message": "Cannot change status from X to Y" }` for any transition not in the
  diagram above — e.g. `PENDING → DELIVERED` directly, or anything out of `DELIVERED`.
  This applies even to `ADMIN` — ownership ("can you touch this row") and transition
  validity ("is this specific change legal") are two independent checks.
- `404` if the item doesn't exist.
- `200` → the updated item on success.

---

## 8. Frontend payment integration guide — Stripe (Phase 4.4 — built)

This section documents what was already built for the Stripe checkout UI, kept here as
reference for anyone working on the frontend. See §9 below for the equivalent SSLCommerz
guide, which is **not built yet**.

### What already exists on the backend (don't rebuild these)

- `POST /api/orders` creates the order **and** a Stripe `PaymentIntent`, returning
  `{ order, clientSecret }` — see §7 above for the full shape.
- A webhook (`POST /api/payments/webhook`) already listens for Stripe's
  `payment_intent.succeeded`/`payment_intent.payment_failed` events and updates
  `Payment.status` (and rolls back stock + cancels the order on failure) automatically.
  **The frontend never calls this endpoint** — Stripe calls it directly, server-to-server.
  Nothing needs to be built or triggered for it from the frontend.

### What Phase 4.4 needs to build

1. **Packages:** `@stripe/stripe-js` and `@stripe/react-stripe-js`.
2. **A publishable key**, not the secret key — get it from the Stripe Dashboard →
   Developers → API keys → **Publishable key** (starts with `pk_test_`, safe to expose in
   frontend code/env vars, unlike the `sk_test_...` secret key which must never leave the
   backend). Store it as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or equivalent) so Next.js
   exposes it client-side.
3. **The checkout flow:**
   - Call `loadStripe(publishableKey)` **once**, at module scope (not inside a component,
     to avoid recreating it on every render).
   - Submit the cart to `POST /api/orders` as normal → receive `{ order, clientSecret }`.
   - Wrap the payment form in `<Elements stripe={stripePromise} options={{ clientSecret }}>`.
   - Render Stripe's `<PaymentElement />` inside it, plus your own submit button.
   - On submit, call `stripe.confirmPayment({ elements, confirmParams: { return_url: ... },
     redirect: 'if_required' })`. `redirect: 'if_required'` lets a simple successful card
     payment resolve without leaving the page; a 3D-Secure challenge will still redirect to
     `return_url` and back.
4. **After `confirmPayment` resolves, don't trust its result as the final word.** The
   *authoritative* status lives in our database, set by the webhook (which may arrive a
   moment after Stripe's client-side confirmation). Recommended pattern: after
   `confirmPayment` resolves without an error, fetch `GET /api/orders/:id` (polling briefly
   if `payment.status` is still `PENDING`) to show the buyer the real, backend-confirmed
   outcome rather than assuming success immediately.
5. **The `return_url` page** (wherever a 3D-Secure redirect lands) should also just fetch
   `GET /api/orders/:id` and render whatever `payment.status` actually is — don't try to
   parse Stripe's own redirect query params for the final answer.

### Stripe test card numbers (test mode only)

| Card number | Behavior |
|---|---|
| `4242 4242 4242 4242` | Succeeds immediately (any future expiry, any CVC, any postal code) |
| `4000 0025 0000 3155` | Requires 3D Secure authentication (tests the redirect flow) |
| `4000 0000 0000 9995` | Declined — insufficient funds (tests the failure/rollback path end-to-end) |

Using the decline card is a good way to manually verify the whole 4.3 rollback chain works
from the buyer's actual perspective: stock should be restored and the order should show
`CANCELLED` shortly after the decline.

---

## 9. Frontend payment integration guide — SSLCommerz (Phase 4.6.4 — not built yet)

Fundamentally different flow from Stripe's — **no embedded card form, no `Elements`,
no `PaymentElement`**. This is a full-page redirect gateway.

### What already exists on the backend (don't rebuild these)

- `POST /api/orders` with `{ items, provider: "SSLCOMMERZ" }` creates the order and
  initiates a real SSLCommerz sandbox session, returning `{ order, gatewayPageUrl }` — see
  §7 above for the full shape.
- An IPN endpoint (`POST /api/payments/sslcommerz-ipn`) already listens for SSLCommerz's
  callback, re-validates it server-to-server against SSLCommerz's own Validation API (never
  trusts the callback alone), and updates `Payment.status` (rolling back stock + cancelling
  the order on failure) automatically. **The frontend never calls this endpoint** —
  SSLCommerz calls it directly, server-to-server, same relationship as the Stripe webhook.

### What Phase 4.6.4 needs to build

1. **No packages needed** — this is just a browser redirect, no Stripe-Elements-style SDK
   involved.
2. **The checkout flow:**
   - Submit the cart to `POST /api/orders` with `provider: "SSLCOMMERZ"` → receive
     `{ order, gatewayPageUrl }`.
   - **Redirect the entire browser** to `gatewayPageUrl` — e.g.
     `window.location.href = gatewayPageUrl`. Do **not** try to render this inline in an
     iframe or embedded component; SSLCommerz's own hosted page handles card/mobile-banking
     entry entirely on their domain.
3. **Three frontend routes must exist**, because the backend already configured these exact
   URLs when initiating the session (not something the frontend passes in or can change
   without also updating the backend's `order.service.ts`):
   - `${FRONTEND_URL}/checkout/sslcommerz/success`
   - `${FRONTEND_URL}/checkout/sslcommerz/fail`
   - `${FRONTEND_URL}/checkout/sslcommerz/cancel`

   SSLCommerz redirects the browser to one of these after the user finishes on their
   hosted page. **None of these three pages should trust their own existence/URL as proof
   of the outcome** — same principle as Stripe's `return_url`: even landing on `/success`
   doesn't guarantee the IPN has been processed yet (or ever will be, if IPN delivery is
   delayed or fails). Each page should fetch `GET /api/orders/:id` and render whatever
   `payment.status` actually is, polling briefly if it's still `PENDING` — identical pattern
   to the Stripe `return_url` handling in §8.

### A real, unresolved gap worth knowing before testing this end-to-end

Stripe had `stripe listen` (the CLI) to forward real webhook events to `localhost` during
local development. **SSLCommerz has no equivalent local-forwarding tool.** Their IPN call
is sent from SSLCommerz's real servers to whatever `ipn_url` was configured
(`${APP_BASE_URL}/api/payments/sslcommerz-ipn`) — if that's `localhost:5000`, SSLCommerz's
servers cannot reach it, the same "can't reach localhost from the internet" problem Stripe
had, but without a CLI workaround. Testing the real IPN delivery path (as opposed to the
backend logic itself, which is already tested) will likely need a tunneling tool (e.g.
`ngrok`, `cloudflared`) to expose `localhost:5000` with a temporary public URL, updating
`APP_BASE_URL` accordingly before initiating a test session. This is a 4.6.5 concern, not
something to solve while building the frontend redirect flow itself.

---

## 10. Quick endpoint index

```
GET    /health

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/users              (ADMIN)
GET    /api/users/:id          (self or ADMIN)
PUT    /api/users/:id          (self or ADMIN; role field ADMIN-only)
DELETE /api/users/:id          (ADMIN)

GET    /api/categories         (public)
GET    /api/categories/:id     (public)
POST   /api/categories         (ADMIN)
PUT    /api/categories/:id     (ADMIN)
DELETE /api/categories/:id     (ADMIN)

GET    /api/products           (public)
GET    /api/products/:id       (public)
POST   /api/products           (SELLER)
PUT    /api/products/:id       (owner or ADMIN)
DELETE /api/products/:id       (owner or ADMIN)

POST   /api/orders                    (any authenticated role — checkout; body.provider: STRIPE default | SSLCOMMERZ)
GET    /api/orders                    (own orders as buyer)
GET    /api/orders/admin              (ADMIN — every order in the system)
GET    /api/orders/seller-items       (SELLER — own sold items only)
GET    /api/orders/:id                (order's buyer or ADMIN)
PATCH  /api/orders/items/:id/status   (item's seller or ADMIN)

POST   /api/payments/webhook          (Stripe only — never call this from the frontend)
POST   /api/payments/sslcommerz-ipn   (SSLCommerz only — never call this from the frontend)
```
