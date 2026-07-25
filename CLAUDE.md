# Project: Multi-Vendor Marketplace (Learning Project)

## What this project is

A backend-focused learning project: a mini multi-vendor marketplace (like a small
Daraz/Etsy) with Buyers, Sellers, Admins, Products, Orders, Payments, and Reviews.
The frontend will eventually be Next.js/TypeScript, but the current focus is
entirely the backend.

## Who is building this and why

I'm a frontend developer with 4+ years of production experience in React/Next.js/
TypeScript. My backend knowledge is currently basic-level CRUD with Node.js and
Express only — no real experience yet with auth systems, relational schema design,
RBAC, payments, or production backend concerns. This project exists to close that
gap for real, not to produce a portfolio piece I can't defend in an interview.

**The core goal is understanding, not speed.** I am not on a deadline. Every
feature must be something I can explain, defend, and rebuild from memory before
we move to the next one — not just code that runs.

## Why "multi-vendor" specifically

A single-seller store barely touches real backend complexity. Multiple sellers
force genuine backend problems: role-based access control, per-seller order
splitting, inventory ownership checks, and payout logic. These are the things
that actually come up in backend interviews, which is the point of this project.

## Tech stack

- **Backend:** Node.js + Express + TypeScript (see note below on Nest.js)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT access + refresh tokens, role-based (buyer / seller / admin)
- **Payments:** Stripe (test mode) first, then SSLCommerz/bKash sandbox
- **Frontend (later phase):** Next.js, TypeScript, Zustand — already known, not a
  learning focus here

## Why we are NOT starting with the production-grade approach

We are deliberately building this in stages of increasing complexity rather than
scaffolding a fully production-hardened app on day one, for one reason: **when
something breaks, I need to know which layer broke.** If auth, RBAC, a new ORM,
a new framework, and payment webhooks are all introduced simultaneously, a bug
could be caused by any of them, and I won't build real understanding of any of
them. Isolating variables one at a time is the point, not a shortcut.

Specific sequencing decisions and why:

- **Plain Express before Nest.js.** Nest.js is on the target list because BD job
  postings ask for it, but it will be introduced as a *port* of a working, fully
  understood Express implementation — not learned at the same time as the
  underlying concepts (RBAC, layered architecture, etc). Learning a framework's
  opinions at the same time as the concept it wraps makes it hard to tell which
  one you don't understand.
- **Stripe (test mode) before SSLCommerz/bKash sandbox.** Stripe has cleaner docs
  and a cleaner webhook/payment-intent model, so it's used to learn what a
  payment flow *is*. bKash/SSLCommerz sandbox integration is a genuine
  differentiator for Bangladesh job applications and will be added once the
  underlying payment concept is solid, so sandbox quirks don't get confused with
  conceptual gaps.
- **Prisma from day one, not raw SQL first.** Unlike the two cases above, this is
  not "simple version first, complex version later" — building the schema in raw
  SQL and then porting to Prisma later would just mean re-doing the same
  relational modeling work twice, not layering new concepts. Prisma still
  requires designing the real schema, keys, indexes, and relations by hand — it
  just removes hand-written SQL strings and migration files, which matches how
  this would actually be built on a real team. SQL fundamentals (joins, indexes,
  transactions) are covered separately by reading Prisma's generated migration
  files and by enabling Prisma's query-logging, not skipped.
- **Production-grade hardening (structured logging, rate limiting, deployment
  config, etc.) is its own final phase**, applied across the whole project once
  every feature is understood — not built in from the start.

## Project phases

1. **Foundation** — folder structure (routes/controllers/services/repositories),
   Prisma schema for User/Product/Category, basic CRUD endpoints for Category only
   (proves the layered pattern end-to-end), no auth yet. CRUD for User and Product
   is deliberately deferred to Phase 2 — see below.
2. **Auth & RBAC** — JWT + refresh tokens, buyer/seller/admin roles enforced at
   the route and query level. User CRUD is built here, not Phase 1: user creation
   *is* registration (password hashing, role assignment), so a throwaway
   pre-auth "create user" endpoint would just be rebuilt from scratch once auth
   exists. Product CRUD is also built here, right after auth: a Product's
   `sellerId` needs to come from the real authenticated user, not a manually
   supplied field, so building Product CRUD before auth would mean redoing the
   create/update endpoints anyway.

   Sub-steps, in order:
   - [x] Schema: `password` on `User`, new `RefreshToken` model.
   - [x] Register / login / refresh / logout — bcrypt hashing, short-lived JWT
     access token, random-bytes refresh token stored server-side (in the DB, so
     logout/revocation actually works), delivered as an `httpOnly` cookie scoped
     to `/api/auth`. Self-registration is restricted to `BUYER`/`SELLER` only —
     `ADMIN` can never be set via the public register endpoint. Rate-limited,
     Zod-validated.
   - [x] `protect` middleware — verify the JWT access token on protected routes,
     attach the decoded user to `req.user`.
   - [x] `restrictTo(...roles)` middleware — check `req.user.role` against an
     allow-list, used per-route (e.g. only `ADMIN` can create/delete a
     `Category`).
   - [x] Apply `protect`/`restrictTo` to the existing `Category` routes as the
     first real test case of route-level RBAC. `GET` stays public; `POST`/
     `PUT`/`DELETE` require `protect, restrictTo("ADMIN")`. Tested: no token,
     tampered token, wrong role (403), and correct ADMIN role (full access) —
     all verified working.
   - [x] `User` CRUD (registration already covers create; still need
     read/update/delete, admin-only where appropriate). `GET /` (list all) and
     `DELETE /:id` are `ADMIN`-only. `GET /:id` and `PUT /:id` allow the account
     owner or an `ADMIN`. `role` can only be changed by an `ADMIN` — a self-edit
     containing `role` is rejected even for the account owner, to block
     privilege escalation. Tested: all permission boundaries verified working.
   - [x] `Product` CRUD, using the authenticated user as `sellerId` instead of a
     manually supplied field. `GET` routes are public. `POST` requires role
     `SELLER` (`sellerId` always taken from `req.user.id` — a `sellerId` sent
     in the request body is silently ignored, since it's not part of the Zod
     schema). `PUT`/`DELETE` require the requester to own the product or be
     `ADMIN`, same ownership pattern as `User`. Invalid `categoryId` on
     create/update is caught (Prisma `P2003`) and turned into a 400. Tested:
     role check, spoofed `sellerId` rejection, invalid category, cross-seller
     ownership boundaries, admin override — all verified working.
3. **Multi-vendor core logic** — per-seller inventory, order splitting across
   sellers, ownership checks on every relevant query. This is the heart of the
   project.

   Sub-steps, in order:
   - [x] 3.1 Schema: `Order` and `OrderItem` models. `OrderItem` is the join
     table resolving the `Order`↔`Product` many-to-many relationship, and each
     `OrderItem` carries its own `sellerId` and `priceAtPurchase` — historical
     snapshots, not live references, so past orders never change if a
     seller's price changes later. Status is two separate fields: `Order.status`
     (`PLACED`/`CANCELLED`, the whole checkout's lifecycle) and
     `OrderItem.status` (`PENDING`/`SHIPPED`/`DELIVERED`/`CANCELLED`, each
     seller's own fulfillment progress) — not one shared field. `onDelete`:
     `Restrict` on `Order→User`, `OrderItem→Product`, and `OrderItem→User`
     (protects real financial/business records from disappearing); `Cascade`
     on `OrderItem→Order` (a line item is meaningless without its order).
     Migrated and verified: all four foreign keys and both enums landed as
     designed.
   - [x] 3.2 Checkout / place-order endpoint (`POST /api/orders`, any
     authenticated role). Buyer submits a cart (`{ productId, quantity }[]`);
     service pre-validates each product exists and has enough stock,
     computes `totalAmount` using `Prisma.Decimal` (not floats) from current
     prices, then the repository creates the `Order` + all `OrderItem` rows
     and decrements each product's `stock` inside one `$transaction`. Stock
     decrement uses a guarded `updateMany` (`WHERE stock >= quantity`) so the
     write itself is safe even under concurrent requests — full concurrency
     stress-testing is still deferred to 3.6. Tested: no token (401), empty
     cart (400), nonexistent product (404), insufficient stock (409) with
     the atomic decrement/rollback confirmed, and a successful multi-item
     order with correct total and per-product stock decrement — all
     verified working.
   - [x] 3.3 Buyer-facing order views — `GET /api/orders` (own orders only),
     `GET /api/orders/:id`, same ownership-check pattern as `User`/`Product`.
     Both responses include nested `items`. Tested: no token (401), own
     orders list, another buyer's empty list, owner access (200), non-owner
     access (403), `ADMIN` override (200), nonexistent id (404) — all
     verified working.
   - [x] 3.4 Seller-facing order views — `GET /api/orders/seller-items`
     (`restrictTo("SELLER")`), the actual "order splitting": a seller sees
     only the `OrderItem` rows where `sellerId` matches them, even when
     those items belong to a larger order containing other sellers'
     products they never see. Response includes the product name and a
     `select`-limited `order` (id/status/buyerId/createdAt only — critically
     *not* the order's full `items`, which would otherwise leak other
     sellers' line items right back through the relation). Route registered
     *before* `GET /:id` to avoid Express matching `seller-items` as an `:id`
     value. Tested with two sellers in one order: each saw only their own
     item, same `orderId`, no cross-seller leakage — verified working.
   - [x] 3.5 Fulfillment status updates — `PATCH /api/orders/items/:id/status`
     (owner or `ADMIN`). Status transitions follow a fixed state machine
     (`PENDING → SHIPPED/CANCELLED`, `SHIPPED → DELIVERED/CANCELLED`,
     `DELIVERED`/`CANCELLED` are final) enforced in the service, independent
     of the ownership check — an invalid transition is rejected with 400
     *even for `ADMIN`*, since "is this allowed" and "who can attempt it" are
     deliberately separate checks. Tested: no token (401), wrong seller and
     buyer both blocked (403), invalid jump `PENDING→DELIVERED` (400), valid
     `PENDING→SHIPPED→DELIVERED` sequence (200), backwards transition (400),
     and `ADMIN` blocked from `DELIVERED→CANCELLED` — all verified working.
   - [x] 3.6 Concurrency safety — stress-tested the guarded stock decrement
     from 3.2 (not just assumed correct) by firing 8 truly concurrent
     checkout requests at a product with `stock: 1`. Result: exactly one
     `201`, seven `409 Insufficient stock`, final stock `0` — never negative,
     never oversold. The mechanism is the conditional `updateMany({ where: {
     stock: { gte: quantity } }, ... })` inside the `$transaction`: Postgres's
     row-level locking serializes concurrent writes to the same row, so only
     one transaction's guard can succeed once stock hits zero. No additional
     code was needed beyond what 3.2 already built — this step proved the
     existing design, rather than changing it.
   - [x] 3.7 Admin-wide order list (gap found while building the frontend):
     `GET /api/orders/admin` (`restrictTo("ADMIN")`), returns every order in
     the system with nested items. Added because `GET /api/orders` only ever
     returns the caller's own orders — even for an `ADMIN` — mirroring
     `GET /api/users` (list-all, `ADMIN`-only) sitting alongside the
     self-service `GET /api/users/:id`. Registered before `GET /:id`, same
     route-ordering reason as `seller-items`. Tested: no token (401), buyer
     blocked (403), admin sees all orders across all buyers (200).
4. **Payments** — Stripe test mode first, then SSLCommerz/bKash sandbox.

   Sub-steps, in order:
   - [x] 4.1 Stripe setup + schema. Created a Stripe test-mode account,
     installed the SDK, added the real test secret key to `.env`. Added a
     `Payment` model — `orderId` and `stripePaymentIntentId` both `@unique`
     (enforces one payment per order at the DB level, and gives a lookup key
     for the future webhook), `amount`/`currency` as a financial snapshot
     (same reasoning as `OrderItem.priceAtPurchase`), `onDelete: Restrict`
     on `Payment → Order` (protects real payment records, same as every
     other financial FK in this schema). Migrated and verified.
   - [x] 4.2 Restructure the checkout flow. Decision made deliberately: stock
     is reserved (decremented) at checkout time using the existing guarded
     mechanism from 3.2/3.6, *before* payment is confirmed — not only after
     — so the item is actually guaranteed available to the buyer who's
     paying for it right now. Rollback-on-payment-failure is deferred to
     4.3, since that's inherently triggered by Stripe's webhook telling us
     payment failed. `checkout()` now: validates the cart (unchanged) →
     creates a real Stripe `PaymentIntent` for the computed total → runs the
     existing DB transaction (stock decrement + `Order` + `OrderItem`s) with
     a `Payment` row (status `PENDING`) added to the same transaction →
     returns `{ order, clientSecret }` instead of just the order. Tested
     against the real Stripe test API: a genuine `PaymentIntent` was created
     and is visible in the Stripe Dashboard, and the `Payment` row correctly
     recorded its id, amount, and currency.
   - [x] 4.3 Webhook endpoint — `POST /api/payments/webhook`. Verifies
     Stripe's `stripe-signature` header via `stripe.webhooks.constructEvent`
     (not a JWT — Stripe calls this endpoint directly, not the frontend).
     Required mounting this route's raw-body parser (`express.raw`) *before*
     the global `express.json()` in `app.ts`, since signature verification
     needs the exact raw bytes, not the parsed body. On
     `payment_intent.succeeded`, marks `Payment.status = SUCCEEDED`. On
     `payment_intent.payment_failed`, runs a transaction that restores each
     item's stock, sets `Order.status = CANCELLED`, and marks
     `Payment.status = FAILED` — closing the loop opened by 4.2's decision
     to reserve stock before payment confirms. Guarded by `payment.status
     === "PENDING"` before acting, since Stripe redelivers webhooks
     at-least-once and reprocessing an already-finalized event must be a
     no-op. Tested using `stripe.webhooks.generateTestHeaderString` against
     a real running server (not mocked): successful payment, duplicate
     event delivery (confirmed idempotent), failed payment with full stock
     rollback (`3→1→3`), and an invalid signature correctly rejected with
     `400`. Full end-to-end testing with the real Stripe CLI is still
     deferred to 4.5.
   - [ ] 4.4 Frontend payment UI. Stripe Elements (Payment Element) on the
     checkout page — collecting card details, confirming payment
     client-side, handling declined cards and 3D Secure challenges. This
     lives entirely in the separate frontend project (a different repo/
     Claude Code session), not here — see `docs/API.md` §8 "Frontend payment
     integration guide" for the full, self-contained brief (packages needed,
     publishable-key setup, the `confirmPayment` flow, and Stripe's test
     card numbers). Backend endpoints it depends on (`POST /api/orders`
     returning `clientSecret`, the webhook finalizing payment status) are
     already built and tested — see 4.2/4.3 above.
   - [ ] 4.5 Testing the full payment flow. Stripe test card numbers
     (success, decline, insufficient funds), using the Stripe CLI to forward
     real webhook events to `localhost` so 4.3 gets exercised end-to-end,
     not just assumed correct.
   - [ ] 4.6 SSLCommerz/bKash sandbox integration. Only after 4.1–4.5 are
     solid and understood — the second payment provider, deliberately kept
     separate so sandbox-specific quirks don't get tangled up with the
     underlying payment concept itself.
5. **Reviews & polish** — ratings, seller dashboards, search/filter/pagination.
6. **Production hardening** — revisit every phase with production-grade config:
   structured logging, proper error handling, rate limiting, security headers,
   testing, and deployment (existing Netcup VPS, Docker, Nginx, GitHub Actions).

There are no fixed time estimates per phase — pacing is set by understanding, not
a calendar.

## How I want to work through each phase (please follow this loop)

1. Build the feature for the current phase only — do not get ahead of the phase
   we're on, and do not pre-add production concerns that belong to Phase 6.
2. Explain what was built and why, in plain terms, as part of the response —
   not just the code.
3. I will read through it line by line, run it locally, and test it myself
   before we move on.
4. I will deliberately try to break the feature (invalid input, wrong role,
   expired/tampered tokens, edge cases) and work through interview-style
   questions about it before moving to the next feature.
5. Only after I confirm a phase is fully understood and working do we move to
   the next phase. If I'm still confused, we stay on the current feature and
   go deeper rather than proceeding.

If I ask to move faster or skip a step, treat that as a mistake to flag, not an
instruction to silently follow — the entire point of this project is that I
understand every layer of it.