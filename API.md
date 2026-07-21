# Multi-Vendor Marketplace Backend — API Reference

Status: Phase 1 (Foundation) + Phase 2 (Auth & RBAC) complete. No `Order`/`Payment`/`Review`
endpoints exist yet — those belong to later phases.

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

**Where things stand:** Phase 1 (Foundation — schema + layered CRUD pattern) and Phase 2
(Auth & RBAC — JWT, refresh tokens, role enforcement on every endpoint below) are complete
and manually tested against their permission boundaries. Phase 3 (multi-vendor order
logic), Phase 4 (payments), Phase 5 (reviews/search), and Phase 6 (production hardening)
haven't started yet — nothing below covers `Order`, `Payment`, or `Review`, because those
tables don't exist yet.

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
    "id": "cmrs...",
    "name": "Alice Seller",
    "email": "alice@example.com",
    "role": "SELLER",
    "createdAt": "...",
    "updatedAt": "..."
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

| Method | Path             | Who                      | Behavior                                                                  |
| ------ | ---------------- | ------------------------ | ------------------------------------------------------------------------- |
| GET    | `/api/users`     | `ADMIN` only             | List all users (password never included)                                  |
| GET    | `/api/users/:id` | account owner or `ADMIN` | View one user                                                             |
| PUT    | `/api/users/:id` | account owner or `ADMIN` | Update `name`/`email`; `role` field only accepted if requester is `ADMIN` |
| DELETE | `/api/users/:id` | `ADMIN` only             | Delete a user                                                             |

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

| Method | Path                  | Who          |
| ------ | --------------------- | ------------ |
| GET    | `/api/categories`     | Public       |
| GET    | `/api/categories/:id` | Public       |
| POST   | `/api/categories`     | `ADMIN` only |
| PUT    | `/api/categories/:id` | `ADMIN` only |
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

| Method | Path                | Who                      |
| ------ | ------------------- | ------------------------ |
| GET    | `/api/products`     | Public                   |
| GET    | `/api/products/:id` | Public                   |
| POST   | `/api/products`     | `SELLER` only            |
| PUT    | `/api/products/:id` | product owner or `ADMIN` |
| DELETE | `/api/products/:id` | product owner or `ADMIN` |

### `GET /api/products` / `GET /api/products/:id`

No auth needed. Product shape:

```json
{
  "id": "...",
  "name": "...",
  "description": "...",
  "price": "999.99",
  "stock": 5,
  "sellerId": "...",
  "categoryId": "...",
  "createdAt": "...",
  "updatedAt": "..."
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
  "name": "Laptop",
  "description": "A laptop",
  "price": 999.99,
  "stock": 5,
  "categoryId": "cmrs..."
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

## 7. Quick endpoint index

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
```
