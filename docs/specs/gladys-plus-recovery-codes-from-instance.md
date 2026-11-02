# Gladys Plus two-factor recovery codes generated from the instance

> **Living specification — source of truth.** This document specifies how a Gladys instance
> generates a new set of two-factor recovery codes for a user of its Gladys Plus account, and the
> contract between Gladys, the Gladys Plus Gateway and its JS client. **Rule: any PR that changes
> one of these behaviors or contracts modifies this file in the same diff.**
>
> Status: **implemented** (Gladys, Gateway and `@gladysassistant/gladys-gateway-js` ≥ 4.23.0).

## A. Context

A Gladys Plus user who loses both their two-factor app and their single-use recovery codes is
locked out of their account: the login, the password reset and the generation of new recovery
codes all require the current second factor. The only way out used to be a manual reset by the
maintainer through the admin API (`POST /admin/api/users/:id/reset_two_factor`), which does not
scale and puts a human in the loop of every lockout.

The design relies on what a Gladys Plus user always has: their Gladys instance, at home.

- The instance is **already a trusted party** of the account: it holds the account's RSA / ECDSA
  private keys and the backup key, and it authenticates to the Gateway with its own refresh token.
  An attacker who has admin access to the instance already owns the home.
- The Gladys Plus **password is not replaced**: a recovery code only stands in for the two-factor
  app. And reading the home's data from a new browser still requires that browser's keys to be
  accepted locally on the instance.
- Any rotation is **notified by email** to the user, so one they did not ask for cannot go unnoticed.

Alternatives considered: keeping a local copy of the codes on the instance (stale as soon as the
user rotates them elsewhere, and a secret at rest for nothing), and a time-delayed reset by email
for accounts without an instance (not covered here; still a manual reset).

## B. Flow

1. On the instance, in **Settings › Gladys Plus**, an **admin** opens the "Gladys Plus recovery
   codes" card, picks a Gladys Plus user of the account (the one linked to their local user is
   preselected via `gladys_4_user_id`) and **re-enters their local Gladys password**. A session
   left open on a wall tablet is not enough.
2. Gladys verifies the password (`gladys.user.login` on the requesting admin) and calls the
   Gateway, authenticated **as the instance** (`generateTwoFactorRecoveryCodesInstance`).
3. The Gateway checks that the user belongs to the account of that instance, is active and has
   two-factor enabled, then generates a new set of 10 codes: only their hashes are stored, the
   previous codes are invalidated, the "generate your recovery codes" reminder is reset, and the
   user is emailed (`recovery_codes_generated_from_instance`, EN / FR).
4. Gladys displays the codes **once**, with the usual copy / download actions
   (`GatewayRecoveryCodes` component). Nothing is stored on the instance.

A user with two-factor disabled has no recovery codes to regenerate (403). A revoked user or a
user of another account is not found (404), whatever the caller guessed.

## C. Contracts

### C.1 Gateway — `POST /instances/users/:user_id/two-factor/recovery-codes`

- Authentication: **instance access token** (`accessTokenInstanceAuth`), like `GET /instances/users`.
  A user token is refused (401). Rate limited per IP like the login routes.
- No body. `:user_id` is a Gladys Plus user id (UUID).
- `200 { "recovery_codes": ["1a2b-3c4d-…"] }` — 10 codes, same format and storage as
  `POST /users/two-factor/recovery-codes` (hashed, previous set invalidated, reminder reset).
- `403` two-factor not enabled on that user. `404` user unknown, revoked, email not confirmed, not in
  the account of the instance, or malformed id.
- Side effects: `logger.warn` audit line; email `recovery_codes_generated_from_instance` to the
  user with `{ firstname, instanceName }`. A mail failure is logged and does **not** fail the call.
- Implementation: `userModel.generateTwoFactorRecoveryCodesFromInstance(instance, userId)`, which
  shares `storeNewTwoFactorRecoveryCodes` with the user-authenticated route.

### C.2 JS client — `generateTwoFactorRecoveryCodesInstance(userId)`

`@gladysassistant/gladys-gateway-js` ≥ 4.23.0. POST on the route above with the current
(instance) access token, refreshed on 401 like every other request.

### C.3 Gladys — `POST /api/v1/gateway/user/:gateway_user_id/recovery-codes`

- `authenticated`, `admin`, `rateLimit`. Body `{ "password": "<local password of the admin>" }`.
- `403 { message: "WRONG_PASSWORD" }` when the password is missing or wrong — the Gateway is
  **not** called. `403 { message: "GATEWAY_TWO_FACTOR_NOT_ENABLED" }`, `404 { message:
  "GATEWAY_USER_NOT_FOUND" }`, `500 { error: "NO_CONNECTED_TO_THE_INTERNET" }` map the Gateway
  answers (`gateway.generateUserRecoveryCodes`).
- `200 { "recovery_codes": [...] }` passed through from the Gateway.

### C.4 Front

`front/src/routes/settings/settings-gateway/GatewayUserRecoveryCodes.jsx`, rendered on the Gladys
Plus settings page below the remote users list, fed by the same `gatewayUsersKeys` list (ids,
names, `gladys_4_user_id`). Strings under `gateway.recoveryCodes*` in every language file.

## D. Out of scope

- Resetting the two-factor **secret** itself: the user re-enrolls their app from Gladys Plus
  after logging in with a recovery code, as today.
- Accounts with **no linked instance** (fresh reinstall, lost hardware): still a manual reset.
- Letting a non-admin local user, or a remote (Gladys Plus tunnel) session, trigger the flow.
