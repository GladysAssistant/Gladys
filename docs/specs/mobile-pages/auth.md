# Signing in and recovering an account on a phone

> Part of [`mobile-pages`](README.md) — principles and kit there. **Any PR that changes one of
> these behaviors modifies this file in the same diff.**

## A. Context

The logged-out pages are the first thing a phone shows of Gladys: the sign-in, the password that
was forgotten, the keypad of an armed house, and on Gladys Plus (`config.gatewayMode`) the
sign-in in two steps, the two-factor setup, the links received by e-mail and the account
creation. Opening Gladys from a phone, away from home, is what Gladys Plus is for — and a link
received by e-mail is opened on the phone that received it.

They were the desktop card (`AuthLayout`), which fits a phone but is not made for it:

- fields of 15 px (iOS zooms into each of them), with no hint for the keyboard nor the autofill:
  a capital letter in the e-mail address, the saved password not proposed, the code of the
  two-factor app typed on a full keyboard, no way to read a password typed on a small keyboard;
- targets that are a line of 13 px text: "I forgot my password", "Back to login", "Use a
  recovery code", "iOS - Android";
- the refusal of a request at the top of a card the user is at the bottom of;
- a keypad with a 16 px field and no key to validate within reach;
- a **QR code to scan with the phone that shows it**: the two-factor app is on that same phone.

## B. The shell and the forms (< 768 px, or a phone in landscape)

Below the phone breakpoint (README B) each page renders, instead of the card,
`MobileAuthLayout` (`components/auth/MobileAuthLayout.jsx`) — the shell the onboarding already
uses (`onboarding.md` B builds on it):

- the Horizon wallpaper of the logged-out pages, and on it **the glass of the desktop card**:
  the shell sets the glass variant of the kit (README C.9), so the bars, the groups of rows, the
  fields and the keys of the keypad are frosted glass and the primary action is the ink pill.
  **The fields of a form sit on one glass card** (`MobileAuthCard`) — the card of the desktop
  page, without its title; the blocks of a screen (steps, recovery codes) are glass cards too.
  A glass card never holds the bottom bar, which is fixed to the screen;
- the **navigation bar** of the kit, with the logo and the name of the product as its title
  ("Gladys Assistant"; "Gladys Plus" on the two-factor setup, the account creation and the user
  link), and the way back only where there is a page to go back to: "‹ Login"
  (`login.mobile.navBack`) on the pages reached from the sign-in or from an e-mail, "‹ Back"
  between the steps of a flow. The sign-in and the keypad have none;
- the title of the screen (`MobileAuthTitle`: the title of the desktop card, as a large title —
  it wraps, it never widens the page) and the content, at most 40 rem wide;
- **one primary action per screen, in the bottom bar** (`MobileAuthBar`, README C.4), with a
  spinner while its request is in flight;
- a page made of several screens (the steps of a flow, a form then its answer) **starts each
  new screen at the top**, like a new page (`screen`).

These pages have no app top bar to hide (the header is not rendered on them): they do not need
`FocusPage`.

What the forms share (`components/auth/mobile.jsx`):

- **Each page keeps its container.** The presentational component picks its layout with
  `withMobileViewport` and gives the phone layout the props and the handlers of the card: the
  validation, the requests and their payloads are the ones of the desktop page (README B).
- The form is a `<form>` (`MobileAuthForm`): the keyboard's key submits it (`enterkeyhint` says
  "go", "next" or "send"). Once the handler ran — and again once it settled, for what the server
  refuses (a wrong one-time code) — **the first refused field is brought into view and
  focused**. A page whose container has no validation of its own keeps the one of the browser
  (`nativeValidation`).
- **The error of a field is next to it** (`role="alert"`) and tied to its control
  (`aria-invalid`, and `aria-describedby` pointing to the error, named `${id}-error` by
  `MobileField`); **the refusal of a request is in the bottom bar**, above the button, and can
  be closed — a new attempt shows it again.
- **What was typed stays on screen.** The fields are controlled: a page reads from its store or
  its state every value it shows.
- The right keyboard for each field:

  | Field | Keyboard and autofill |
  | --- | --- |
  | E-mail of a sign-in or a recovery (`MobileEmailField`) | `type="email"`, `autocomplete="username"` (the phone proposes the saved account), no capitals, no correction |
  | Current password (`MobilePasswordField`, README C.3) | `autocomplete="current-password"`, a reveal button in the same control |
  | New password | `autocomplete="new-password"` (the phone proposes and keeps a strong one), a reveal button |
  | Code of the two-factor app (`MobileCodeField`) | `inputmode="numeric"`, `autocomplete="one-time-code"`, six large spaced digits |
  | One-time code, recovery code (`MobileTextField`) | no correction; capitals for the one-time code of the local recovery, none for a recovery code |

- A link that is an action of its own ("I forgot my password", "Send a new code") is a 44 px
  target under the field it relates to; a link inside a sentence (help, documentation) stays a
  footnote.
- A screen that only waits or only tells (an e-mail being confirmed, keys being generated) shows
  a spinner or a check, one sentence, and the way on in the bottom bar when there is one.

## C. The pages of an instance

### C.1 Sign-in (`/login`, `routes/login`)

"Login to your account", the e-mail and the password, "I forgot my password" under them, the
help as a footnote, **Log in** in the bottom bar.

- An address that is not an e-mail is refused next to the field, before anything is sent.
- "Wrong email/password." shows in the bottom bar.
- Same store actions as the card (`actions/login/login.js`): the same `POST /api/v1/login`, the
  same redirection to `return_url`.

### C.2 Password recovery (`/forgot-password`, `routes/forgot-password`)

Two screens of the same page, with "‹ Login" as the way back:

1. the **e-mail address**, and **Recover my password** in the bottom bar;
2. once the request is accepted: what was sent and where to find it (a success notice — the
   link or the code is sent by Telegram or Nextcloud Talk, or written in the logs), the
   **one-time code** field, "Send a new code" under it, and **Continue** in the bottom bar. A
   valid code leads to the new password (C.3).

**Asking for a new code keeps the code screen** (`codeSent`, kept by the container once a code
was requested): "Send a new code" shows a spinner while its request is in flight, the code
already typed stays, and a refusal of the resend shows in the bottom bar. A new code cannot be
asked for while one is being checked (the code is single use: on every screen size).

An address that is not an e-mail and an empty or refused code show next to their field; a
refusal of the server (network, unknown account, too many attempts, unknown) shows in the bottom
bar. A code the instance refuses is its 401 — or the 400 the http client gets when, without a
session, it answers that 401 by refreshing a token it does not have: both are "This code is
invalid or has expired", on every screen size (the 400 used to show as an unknown error).

### C.3 New password (`/reset-password`, `routes/reset-password`)

The password twice, each with its reveal button and its error next to it (too short, not the
same), **Reset my password** in the bottom bar. Then one of two screens:

- the password is changed: a success notice, and **Click here to login** in the bottom bar;
- the request is refused (a dead link, network, too many attempts): the reason as a notice, the
  fields are gone — there is nothing left to type — and **Generate new forgot password link** in
  the bottom bar leads to C.2.

### C.4 Keypad of an armed house (`/locked`, `routes/locked`)

A session in tablet mode is sent here when its house is armed. Tablet mode cannot be turned on
below 768 px, so this layout is the one of **a phone held in landscape and of a small wall
panel** (a touch screen at most 500 px high, an 800 × 480 panel for instance), and of a narrow
tablet in portrait.

- "Locked House", the sentence, then **the code as it is typed**: dots, centered. The field is
  read-only with `inputmode="none"`: the keypad is the keyboard, the one of the phone stays
  closed. **It is not a password field**: a password manager would offer to save or fill the
  code of the alarm. It is a text field that only ever holds one dot per digit typed
  (`data-length`); the code itself stays in the state of the page.
- **Twelve positions, three columns**: the digits 1 to 9, then 0 in the middle with the
  **correction key** on its right (disabled while there is nothing to correct, named for
  assistive technologies by `locked.mobile.deleteDigit`). Keys are at least 44 px and share the
  height the screen leaves, up to 72 px (`clamp()` on `100dvh`): **the keypad never needs to be
  scrolled**, from a 320 × 568 screen up.
- **In landscape** (at most 500 px high) the title and the code are on the left, the keypad on
  the right.
- **Validate** is in the bottom bar, with a spinner while the code is checked (`validating`, a
  display state of the container).
- A wrong code shows next to the code field, which is emptied; "Please wait … minutes" and an
  unexpected error show in the bottom bar.
- Same container: the same `POST /api/v1/house/:selector/disarm_with_code`, the same
  redirection to the dashboard when the house is disarmed.

## D. The pages of Gladys Plus (`config.gatewayMode`)

### D.1 Sign-in (`/login`, `routes/login-gateway`)

`MobileGatewayLoginForm` (`components/gateway/`), fed by the props of `GatewayLoginForm` — one
question per screen:

1. **the account**: e-mail, password, "I forgot my password", **Log in**;
2. **the second factor**: the code of the two-factor app. It is sent as soon as its six digits
   are typed (the store action does it, as on desktop); **Finalize Login** stays in the bottom
   bar for a pasted code. While a code is checked the field cannot be edited (`readonly`: a
   second code would start a second request). A refused code shows next to the field, and stays
   in it.
   Under the field, **"Lost access to your two-factor app?"** is a group of rows
   (`MobileLostTwoFactor`):
   - **Use a recovery code** swaps the field for the recovery code one — and the row for "Use a
     code from your two-factor app instead";
   - **Reset by email** (`gatewayLogin.mobile.resetTwoFactorTitle`, with the sentence of the
     desktop link under it), only when the page offers the reset
     (`gladys-plus-recovery-codes-from-instance.md` E.5) and until its e-mail is sent: the row
     then gives way to the "We sent you an email" notice;
   - the two sentences of the desktop form (an admin can generate new codes; the troubleshooting
     guide) as footnotes.
3. **the recovery codes**, when two-factor was just enabled (D.2).

The refusals of the sign-in (wrong credentials, no instance, network, unknown) and of the reset
request show in the bottom bar. On the second step the navigation bar has "‹ Login": it starts
the login again (the `init` action — as a reload does).

The same form is the first screen of the backup restore of the onboarding (`onboarding.md` D),
in the shell of the onboarding — glass too — and with the props of that page: no reset by e-mail
there (the page does not offer it), and the password recovery opens on Gladys Plus.

### D.2 Recovery codes (`components/gateway/GatewayRecoveryCodes.jsx`, `mobile`)

The component keeps its logic (copy, download, retry); with `mobile` it renders the phone
layout: the title and what the codes are for, the warning that they are shown once, **the codes
in two columns on a card**, **Download** and **Copy** side by side ("Copied!" replaces the label
once done), and **Continue** in the bottom bar. When the generation failed: the reason, the
field for a fresh code of the two-factor app when the caller collects one (a refused code is
also said next to it), and **Try again** in the bottom bar, disabled until six digits are
typed. The settings pages keep the card.

### D.3 Two-factor setup (`/gateway-configure-two-factor`)

Two screens with "Step 1 of 2" / "Step 2 of 2" (`MobileSteps`); the second one goes back to the
first with "‹ Back".

1. **Why and with what**: the two sentences, then the recommended apps as rows
   (`TwoFactorAppList`, `mobile`). On an iPhone or an Android phone a row opens the app **in the
   store of that phone**; elsewhere it carries its two links, each a 44 px target. **Configure
   2FA** in the bottom bar.
2. **Adding the account, then confirming**:
   - **On this phone** — **Open my two-factor app**: a link to the `otpauth://` address the
     Gateway returned (`otpauthUrl`, kept by the container next to the secret). The phone opens
     the two-factor app installed on it with the account ready to be added. A footnote says what
     to do when nothing opens.
   - **By hand, or from another device** — the three steps, the **secret** in a read-only field
     with **Copy** in the same control (a "Copied!" toast confirms; `copySecret` resolves with
     whether the clipboard took it), and the **QR code** on a card, captioned for what it is on
     a phone: to scan with an app installed on another device. It stays black on white in dark
     mode.
   - **Confirm**: the code field (grouped by three digits by the container), its refusal next
     to it, **Enable Two-Factor Authentication** in the bottom bar.

Same container: the same `configureTwoFactor` and `enableTwoFactor` calls, the same silent
login afterwards.

### D.4 E-mail confirmation (`/confirm-email`)

A status screen: a spinner and "Confirmation in progress...", then a check and "Email
Confirmed" with **Sign in** in the bottom bar (the confirmed address is given to the sign-in, as
on desktop) — or the refusal as a notice with the two sentences of the desktop card.

### D.5 Forgotten password (`/forgot-password`, `routes/gateway-forgot-password`)

The e-mail address and **Send reset password email**; then the same neutral answer as on
desktop ("If this account exist…") as a notice, with **Log in** in the bottom bar. The container
has no validation of its own: as on the desktop form, the browser refuses an address that is
not one before any request (`nativeValidation`). "‹ Login" is
the way back; "Don't have an account yet?" is a footnote.

### D.6 New password (`/reset-password`, `routes/gateway-reset-password`)

The password twice (a short one is refused next to the first field, a different one next to the
second), then — when the account has two-factor authentication — the code of the app or a
recovery code, with the rows of D.1 under it (the reset by e-mail goes through the reset
password token here). A refused recovery code shows next to its field; a dead link and a refused
reset request show in the bottom bar. Once the password is changed: a success notice and **Log
in** in the bottom bar.

### D.7 Two-factor reset (`/reset-two-factor`)

The landing page of the reset e-mail: what the reset does, and **Reset my two-factor
authentication** in the bottom bar — **nothing is reset before that button is tapped**, as on
desktop (an e-mail client prefetching the link must not do it). Then the success as a notice
with **Log in** in the bottom bar; a refusal (dead link, instance connected again, unknown)
shows above the button; a link without a token only shows the refusal and the way to the
sign-in.

### D.8 Account creation (`/signup-gateway`)

The name, the e-mail address (the one of the invitation: it is shown, it cannot be changed) and
the password with its reveal button; each refusal of the validation next to its field; **Create
new account** in the bottom bar, with the refusal of the server above it (address already used,
no subscription, unknown). While the keys are generated in the browser the screen only waits;
once the account exists: "Your account is created" and **Sign in** in the bottom bar. An
invitation that cannot be read, or a browser without WebCrypto, shows its reason and no form.

A new attempt starts from a clean form on every screen size: the container forgets what the
previous one was refused for (the fields and the banner used to keep the errors of the attempt
before).

### D.9 Linking a Gladys user (`/link-gateway-user`, `routes/gateway-setup`)

One of the three screens of the desktop card, each with its action in the bottom bar:

- **the instance is not connected yet**: the five steps to follow at home, numbered on a card,
  and **I connected my instance, try again**;
- **the user is not authorized on the instance**: why, who can authorize it, the four steps, the
  fingerprints of the keys to compare (two rows, each fingerprint on its own lines), and **My
  user is authorized, try again** — "Your user is still not authorized" shows above the button
  when the retry changes nothing;
- **the user to link**: the native list of the Gladys users and **Save**. The list shows the
  selection the container holds (`selectedUser`), on both layouts: what Save sends is what is
  shown, also when the layout changes with the page open.

Under each of them, "My Gladys Plus account" groups two rows: **Manage my subscription and
invoices** and **Log out**.

## E. What does not change

- From 768 px (a phone in landscape excepted): the card of each page, as before — the desktop
  spec (`login/Login.cy.js`) passes unchanged.
- The requests and their payloads, the routes, the store actions and the containers. The two
  containers touched only gained display state — `validating` (keypad), `otpauthUrl` /
  `previousStep` (two-factor setup), `codeSent` (password recovery), `selectedUser` given to the
  list (user link) — the values the Gladys Plus sign-in shows (its page now reads them from the
  store), the clean start of an attempt (D.8) and the guard against a resend while a code is
  checked (C.2).
- The existing translations are reused; the new ones are under the `mobile` key of their page
  (`login.mobile`, `locked.mobile`, `gatewayLogin.mobile`, `gatewayTwoFactorAuth.mobile`,
  `gatewaySignUp.mobile`, `gatewayLinkUser.mobile`), and `mobileKit.togglePassword` for the
  reveal button of the kit.

## F. Tests

- Cypress, phone viewport, `front/cypress/e2e/routes/login/AuthMobile.cy.js`:
  - the **sign-in against the instance**: the attributes of the fields, 16 px, an address that
    is not an e-mail refused next to its field and focused with nothing sent, the reveal button,
    the form submitted by the keyboard, the refusal in the bottom bar closed and shown again, a
    login that leads to `return_url`, the card kept on a wider screen;
  - the **password recovery and the new password, stubbed** (their requests are rate limited
    and send messages): the two screens and their request bodies, the refusals next to the
    fields and in the bottom bar, the token of the code given to the new password, the dead
    link;
  - the **keypad**, with a real session and two stubbed answers (the instance refusing the
    session for the dashboard, as it does for a locked tablet, and the answer to the code — the
    real ones need an armed house): eleven keys of at least 44 px, the code typed and corrected
    without the keyboard of the phone, nothing to scroll, the body of the request, a wrong code
    next to the field, a blocked keypad in the bottom bar, the card kept on a wider screen.
- Cypress, `signup/SignupMobile.cy.js`: the **Gladys Plus sign-in** in the restore path — the
  account, the code sent once typed, the recovery code and back, the bodies of the requests.
- The Gladys Plus pages only exist in a build made with `GATEWAY_MODE=true`, which the Cypress
  run does not make. They are checked in a phone emulation with a real touch screen (Playwright,
  390 px and 320 px, light and dark, English and French), **with the Gateway client faked in the
  page**: the real containers and store actions run, only the calls to the Gateway are answered
  by the test. Every screen of D.1 to D.9 is driven — forty of them — and the test checks what
  is sent (the cleaned e-mail address, the password with its token and its recovery code, the
  invited address) and what never is (no reset before the button).
- The checks every phone page passes (README E), on each of those screens and on the pages of
  an instance: no horizontal scroll, no field below 16 px, no target below 44 px (links in a
  sentence excepted). The keypad is driven **on a real armed house**, in portrait, in landscape
  and on a 320 × 568 screen: a wrong code, then the right one and the dashboard.
