# Gladys Plus two-factor recovery: codes from the instance, reset by email

> **Living specification — source of truth.** This document specifies how a Gladys Plus user who
> lost their second factor gets back into their account without any human intervention: a new set of
> recovery codes generated from their Gladys instance (sections B, C), or, when no instance is
> connected, a reset of the two-factor authentication by email (section E), then replaces their lost
> app with a recovery code (section F). It owns the contract
> between Gladys, the Gladys Plus Gateway and its JS client. **Rule: any PR that changes
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

- Resetting the two-factor **secret** from the instance: the user re-enrolls their app from Gladys
  Plus after logging in with a recovery code, as today. (The reset by email of section E does
  remove the secret, by design: it is the path of last resort.)
- Letting a non-admin local user, or a remote (Gladys Plus tunnel) session, trigger the flow of
  section B.
- Offering the reset by email from the Gladys Plus login form **of the instance** (Settings ›
  Gladys Plus, linking flow): the user does it from the Gladys Plus web app.

## E. Reset by email when no instance is connected

### E.1 Rule

The instance is the second factor of last resort. **While an instance of the account is connected
to the Gateway** (socket authenticated, any node of the cluster), the reset by email is refused
(`403 INSTANCE_CONNECTED`) and the user is sent to section B. When **no instance is connected**
(never linked, dead or lost hardware, long power cut), the user can reset their two-factor
authentication by email, **immediately**: there is no waiting period.

What the reset gives an attacker holding the password and the mailbox is the account itself
(billing, users, the possibility to link a new instance) — not the home: the backups stay
encrypted with the backup key, which only the instance knows and which a password reset
discards, and a new browser still needs its keys accepted locally on an instance. That is why an
immediate reset is acceptable here while it would not be with an instance at home.

The check is done twice: when the link is requested, and when it is used. A link requested while
the instance was offline is refused, and kept, if the instance came back online meanwhile.

### E.2 Flow

1. Login step 2 of the Gladys Plus web app (password accepted, two-factor code asked): "No Gladys
   connected? Reset your two-factor authentication by email." Or, for a user who **forgot their
   password too**, the same link on the reset password page (the reset password token stands for
   the password step).
2. The Gateway emails the user a single-use link, valid **one hour**, at most **one request per
   minute per user** (`two_factor_reset`, EN / FR, with a "if you did not ask for this, change
   your password" danger tile).
3. The link opens `GLADYS_PLUS_FRONTEND_URL/reset-two-factor?token=…`: the reset happens **on
   click** of a button, never on page load (email clients prefetch links).
4. The Gateway disables two-factor on the account: `two_factor_enabled = false`, secret and
   recovery codes removed, failed attempts counter cleared, token deleted. The user is emailed
   (`two_factor_reset_done`). At the next login the Gateway returns an access token with the
   `two-factor-configure` scope, and the web app sends the user to set up a new app, then to
   save new recovery codes, like after a signup.

### E.3 Contracts (Gateway)

- `POST /users/two-factor/reset-request` — auth: **two factor token** (`twoFactorTokenAuth`, the
  2-minute token of the password step); rate limited per IP. `200 { success: true }`. `403
  TWO_FACTOR_NOT_ENABLED`, `403 INSTANCE_CONNECTED`, `429 TWO_FACTOR_RESET_ALREADY_REQUESTED`
  (cooldown), `401` without a two factor token. Email `two_factor_reset` with
  `{ firstname, twoFactorResetUrlGladys4 }`.
- `POST /users/reset-password/:token/two-factor/reset-request` — no auth, rate limited; `:token`
  is an unused, unexpired reset password token (`404` otherwise). Same behaviour and errors.
  The reset password link stays usable afterwards.
- `POST /users/two-factor/reset` — no auth, rate limited; body `{ token }`. `200
  { two_factor_enabled: false }`. `404 TOKEN_NOT_FOUND` (unknown, used, expired or malformed),
  `403 INSTANCE_CONNECTED` (link kept). Email `two_factor_reset_done` with `{ firstname }`; a
  mail failure is logged and does not fail the call.
- Storage: Redis, `two_factor_reset:token:<sha256(token)>` → user id (TTL 1 h) and
  `two_factor_reset:cooldown:<user id>` (TTL 60 s). Only the hash of the token is stored.
- Implementation: `userModel.requestTwoFactorReset`, `requestTwoFactorResetFromPasswordReset`,
  `resetTwoFactor`; the controller provides `isInstanceOfUserConnected` (instance ids of the
  account ∩ `socketModel.getConnectedInstanceIds()`).

### E.4 Contracts (JS client, ≥ 4.23.0)

`requestTwoFactorReset(twoFactorToken)`, `requestTwoFactorResetFromPasswordReset(resetToken)`,
`resetTwoFactor(token)`.

### E.5 Front (Gladys Plus web app, `config.gatewayMode`)

- `GatewayLoginForm`: the link is rendered only when the page provides `requestTwoFactorReset`
  (the login-gateway route does, the Settings › Gladys Plus linking form does not); the
  `gatewayLogin.resetTwoFactor*` strings cover the sent / instance connected / expired session /
  cooldown / error states.
- `routes/gateway-reset-password`: same link under the two-factor fields, through the reset
  password token.
- `routes/gateway-reset-two-factor` (`/reset-two-factor?token=`): one button, states under
  `gatewayResetTwoFactor.*`.
- `gatewayLogin.noRecoveryCode` and the `password_reset` email no longer ask the user to write
  to support: they point to the instance (section B) and to the reset by email.

## F. Replacing the two-factor app with a recovery code

After a login with a recovery code (sections B or E give new ones), the user still has a lost
app registered on the account: every login would burn another code. Settings › Security already
lets the user replace their app, against a code of the **current** app; it now also accepts
**one of their recovery codes** as the current second factor.

- `PATCH /users/two-factor` takes `current_two_factor_recovery_code` as an alternative to
  `current_two_factor_code`. The new secret is still proven by a code of the new app first; the
  recovery code is then **consumed in the same transaction** as the replacement, so a wrong code
  of the new app, or a failed replacement, never costs a recovery code. A wrong or used recovery
  code is `403` and changes nothing.
- Front: `GatewayTwoFactorApp` offers "Lost your current app? Use a recovery code instead" under
  the current code field; `GatewaySession.updateTwoFactor` sends one of the two fields.
- The other recovery codes stay valid; the user is told to generate a new set once the new app
  is set up (that generation still requires a code of the app, which they now have).
