# Gladys Assistant: threat model

Read by Anthropic's OSS Scanner before it audits this repository (enrolment: `anthropics/oss-scanner`, `projects/gladys`).
The build is `.oss-scanner/Dockerfile`. Reports go to the maintainers privately: never open a public issue, see `SECURITY.md`.

## What Gladys is

Gladys Assistant is a self-hosted, privacy-first smart home assistant. A household installs it on a Raspberry Pi, a
NAS or a mini PC on its local network. It controls lights, locks, alarms, heating, cameras, sensors and media through
about 40 internal integrations (`server/services/*`) and third-party "external integrations" running in Docker
containers. It also runs scenes (automations), a chat and an AI assistant.

- `server/`: Node.js (Express + `ws`) on one port (80 in production, 1443 in dev). SQLite through Sequelize for the
  data, DuckDB for the device state history.
- `front/`: Preact single-page app, built and served by the server as static files.
- Gladys Plus (optional, paid): a cloud relay (`server/lib/gateway`, client `@gladysassistant/gladys-gateway-js`). It
  provides remote access through end-to-end encrypted messages, encrypted backups, Alexa / Google Home, OwnTracks and
  webhooks, AI chat and voice.

### How it is deployed, and why it matters for severity

The official install (`README.md`, `docker/docker-compose.yml`) runs the `gladysassistant/gladys` image as **root**,
with `--privileged`, `--network=host`, `--cgroupns=host`, `/var/run/docker.sock`, `/dev`, `/run/udev` and `/run/dbus`
mounted. Gladys needs this to drive USB radios (Zigbee, Z-Wave), Bluetooth, the host's power, and the containers it
manages: MQTT broker, Zigbee2MQTT, Node-RED, Matterbridge, external integrations and upgrades.

Consequences:

- **Code execution in the Gladys process, or control of a container it creates, is root on the host.**
- **The admin role is fully trusted and is root-equivalent by design** (see "By design" below).
- The real security boundaries are the ones that keep everyone else from reaching admin power or the process itself.
- The HTTP port is plain HTTP on the LAN, with no TLS. Remote access goes through Gladys Plus.
- **The LAN is not trusted.** IoT devices, guests' phones and compromised machines can reach the HTTP port, the MQTT
  brokers Gladys starts, and the UDP / mDNS / SSDP traffic the integrations listen to.
- Gladys drives physical-safety devices: locks, alarm, garage doors, heating, cameras. Unauthorised control of those
  is a security issue, not a functional bug.

## Actors and what each may do

| Actor | Trust | May |
| --- | --- | --- |
| Anyone on the LAN, unauthenticated | none | `GET /api/v1/ping`, `GET /api/v1/setup`, login, refresh an access token, forgot / reset password (rate-limited), and the first-run setup (below). Nothing else. |
| First-run visitor, before any account exists | none | Create the first account (`POST /api/v1/signup`) and run the Gladys Plus restore flow (`authenticatedOrNotConfigured` routes). The window closes as soon as one user exists. |
| User with role `habitant` (non-admin household member) | partial | Use the dashboards, control devices, start and stop existing scenes, chat, manage their own profile and their own per-user settings. Must **not** gain any admin capability, directly or indirectly. |
| User with role `admin` | full | Everything, including actions that are root-equivalent on the host. |
| Tablet / "alarm mode" session | restricted | A locked session only gets the `alarm:write` scope (arm or disarm with the code). |
| Gladys Plus user, accepted locally and linked to a local user | that local user | API calls through the tunnel, with the rights of the local user they are linked to. |
| Gladys Plus user not accepted locally | none | Nothing. Their key is unknown or not yet accepted on this instance. |
| Gladys Plus server | relay | Relays end-to-end encrypted messages. It also delivers "open API" messages that are not end-to-end encrypted: OwnTracks location, device state webhook, Alexa, Google Home, MCP webhook, external integration webhooks. |
| External integration container | untrusted code, sandboxed | Only its own tenant through the host API (`/api/integration/v1/*`) and the integration WebSocket, authenticated by a per-integration JWT. Full outbound network access is an accepted risk. |
| LAN devices, MQTT clients, cloud vendor APIs | untrusted data | Their messages are parsed by the integrations: Zigbee2MQTT, MQTT / Home Assistant discovery, Tasmota, Xiaomi UDP, Sonos / UPnP, Hue, Tuya, Bluetooth advertisements, Matter, nmap output, vendor JSON... |
| Messaging senders (Telegram, Nextcloud Talk, communication integrations) | untrusted until linked | Unlinked senders get nothing. Linked senders act as the Gladys user they are linked to. |

Roles are `admin` and `habitant` (`USER_ROLE` in `server/utils/constants.js`). The `admin: true` flag on a route
(`server/api/routes.js` and each `server/services/*/api/*.controller.js`) is enforced by
`server/api/middlewares/adminMiddleware.js`.

## Where untrusted input enters

1. **HTTP API and WebSocket** on the main port.
   - Route table and middleware chain: `server/api/routes.js`, `server/api/setupRoutes.js`, `server/api/middlewares/`.
   - Each service adds routes from `server/services/*/api/`.
   - WebSocket: `server/api/websockets/index.js`.
   - Auth: `server/lib/session/` (JWT access tokens, refresh tokens, API keys).
2. **The Gladys Plus tunnel.**
   - `server/lib/gateway/gateway.handleNewMessage.js` (message types, sender key acceptance).
   - `server/api/setupGateway.js` (maps tunnelled calls onto the same controllers).
   - Requests arriving this way must get exactly the same authorization as local HTTP requests.
3. **The external integration host API and WebSocket.**
   - `/api/integration/v1/*` and `server/api/controllers/integrationHost.controller.js`.
   - `server/lib/external-integration/`, and the manifest validation (`externalIntegration.validateManifest.js`,
     `manifest.schema.json`), which turns a third-party manifest into Docker container descriptors.
   - Design and accepted risks: `docs/specs/external-integrations/` (start with `README.md` and `core/accepted-risks.md`).
4. **MQTT topics, LAN protocols and cloud API responses** parsed by `server/services/*` (see the table above).
5. **Backups.** Creation and restore: `server/lib/gateway/gateway.backup.js`, `gateway.restoreBackup.js`,
   `server/utils/backupSafety.js`. Restoring is an admin action, or a first-run action.
6. **Messaging bots**: `server/services/telegram`, `server/services/nextcloud-talk`, communication integrations. Their
   messages reach the brain, the AI chat and its MCP tools (`server/services/mcp`).
7. **Values stored by one actor and later used by the server.** Device params (camera URLs, IP addresses...), service
   variables, scene definitions, dashboard boxes, user profiles. Pay attention to the ones that reach `child_process`
   (ffmpeg, nmap, tar, sqlite3, openssl), Docker container descriptors, the filesystem, SQL, Handlebars templates,
   mathjs, or outbound HTTP.
8. **The front-end** renders data written by other actors: device and room names, messages, AI and markdown answers,
   external integration widgets and docs. Access and refresh tokens are kept in `localStorage`, so an XSS in the app's
   origin is an account takeover.

## Security properties that must hold (what to look for)

- **Unauthenticated → anything** beyond the routes listed above, once the instance is configured.
- **Habitant → admin.** Covers every route flagged `admin`, and every other way to reach the same power: device params
  or settings that reach a process, a container, the filesystem or a template; scene creation or editing; outbound
  HTTP; Gladys Plus settings; secrets; user management. The other ways in include tunnelled calls, the WebSocket, the
  MCP / AI chat tools, scopes, and service routes.
- **Tunnel authorization.** A Gladys Plus sender whose keys are not accepted locally must not reach the API. An
  accepted sender must not get more than the local user they are linked to. Tunnelled requests must not skip a check
  that applies to the same route locally.
- **External integration tenant isolation and sandbox.**
  - An integration must only read and write its own devices, variables, contacts and containers (`service_id` from its
    JWT is authoritative).
  - It must not reach user or admin APIs.
  - Its manifest and runtime requests must not produce a container with more power than the sandbox allows: host
    paths outside its folder, the Docker socket, privileged mode, devices that were not granted, the host network.
- **Untrusted LAN and device input** must not lead to code or command execution, argument injection, path traversal,
  SQL injection, prototype pollution, or a crash of the server process. A crash takes the whole home automation down,
  alarms included.
- **Messaging.** An unlinked sender must not trigger anything. Linking codes must not be guessable or reusable.
- **Secrets.** Service credentials, Gladys Plus tokens and backup keys, integration JWTs and the JWT signing secret must
  not be readable by non-admin users, other integrations or unauthenticated clients.
- **Session security.** Token validation (audience, scope, expiry, revocation), refresh token and API key handling,
  password reset, alarm mode, and the alarm code check.
- **XSS** in the front from data written by a less trusted actor: a habitant, an integration, a LAN device, a message
  sender, the store.
- **Physical-safety actions** (disarm the alarm, unlock, open) must only be possible for actors allowed to do them.

## By design: do not report

- **Admin is root-equivalent.** These are features, not vulnerabilities:
  - arbitrary outbound HTTP (`POST /api/v1/http/request`, the scene `http.request` action);
  - MQTT publishing to any topic;
  - installing external integrations from any image or repository;
  - Node-RED (a privileged container running user-defined code);
  - restoring any backup;
  - upgrading, rebooting or shutting down the host;
  - reading service secrets and system logs.

  Report an admin-only issue only if it lets an admin's action be triggered by someone else (CSRF-like, XSS, a
  confused deputy).
- **The first-run window.** Before the first account exists, anyone who can reach the instance can create the admin
  account and restore a backup. That is the onboarding flow.
- **No per-device permissions between members of a household.** Every user can see and control every device and run
  every scene. Habitants are only kept out of the admin features.
- **Accepted risks of external integrations**, documented in `docs/specs/external-integrations/core/accepted-risks.md`:
  - full outbound network access;
  - no store moderation;
  - mutable image tags;
  - LAN-exposed ports and hardware classes the user explicitly grants.

  Escaping the sandbox or the tenant isolation is still in scope.
- **CORS `*`.** Authentication uses the `Authorization` header (no cookies), so CORS alone is not CSRF.
- **Missing TLS and HSTS on the local port.** Gladys is served over plain HTTP on the LAN.
- **`DEMO_MODE` and the front's demo data.** The demo website is a static build with no server.

## Out of scope

- Vulnerabilities inside the third-party containers Gladys starts (Mosquitto, Zigbee2MQTT, Node-RED, Matterbridge,
  external integrations), and radio-level attacks on Zigbee, Z-Wave, Bluetooth or Matter.
- Dependency CVEs with no reachable path from Gladys code. If a vulnerable dependency is reachable, report the path.
- Physical access to the host, and attacks that need root on the host.
- Brute force that the existing rate limits already bound, and denial of service by an authenticated admin.
- The Gladys Plus cloud service itself, which lives in another repository. The instance-side handling of what it
  sends is in scope.
- Under `.github/`: issues in the GitHub Actions workflows are in scope at low priority (script injection,
  `pull_request_target` misuse, secret exposure). Bots and repository settings are not.

## How we rate severity

Take into account the deployment above: a root-equivalent process, physical-safety devices, and a LAN that is not
trusted.

- **Critical**
  - Reachable without any account (from the LAN, through Gladys Plus, from an external integration, or from a LAN
    device or message), and leads to one of: code or command execution, an admin account or session, Docker socket
    access, or control of locks or alarms.
  - Escaping the external integration sandbox onto the host or the Docker socket.
- **High**
  - A habitant gains admin power or code execution.
  - Unauthenticated access to personal data: location history, camera images, device history, user data.
  - A Gladys Plus sender reaches the API without being accepted locally, or gets more than their linked user.
  - An integration breaks out of its tenant.
  - Stored XSS that a lower-trust actor can plant and that runs in another user's session.
  - A crash of the server process that an unauthenticated LAN actor or a device message can trigger repeatedly.
- **Medium**
  - A habitant or an integration reads secrets meant for admins: service credentials, Gladys Plus keys, the alarm code.
  - SSRF from a non-admin actor to the LAN.
  - A path traversal bounded to reading non-secret files.
  - A weakness in token validation or revocation that needs a stolen token to be useful.
  - A one-shot crash that needs an authenticated user.
- **Low**
  - User or email enumeration.
  - Sensitive values written to local logs (only admins can read them).
  - Weak randomness for values that are not authentication secrets.
  - Issues that need an admin.
  - GitHub Actions issues.
- Cap a report at **Medium** when it depends on unrealistic preconditions, for example a configuration no
  integration produces.

## How to exercise it

Inside the image:

| Command | What it does |
| --- | --- |
| `cd /src/server && npm test` | Full Mocha suite, about 7,400 tests, about a minute. Runs offline: HTTP is mocked with nock / undici, Docker with sinon. |
| `cd /src/server && npm run test-service --service=<name>` | The tests of one integration, e.g. `mqtt`, `zigbee2mqtt`, `lan-manager`, `rtsp-camera`. |
| `cd /src/server && SERVER_PORT=1443 SQLITE_FILE_PATH=/tmp/gladys.db npm run start:prod` | Runs Gladys (API + built front) on `http://localhost:1443`, offline. The first `POST /api/v1/signup` creates the admin account; an admin can then create a habitant with `POST /api/v1/user`. Expect harmless errors from integrations that look for hardware or the Docker socket. |

Useful test scaffolding:

- `server/test/hooks.js` boots a full Gladys against a seeded test database.
- `server/test/controllers/request.test.js` has `request` (unauthenticated), `authenticatedRequest` (seeded admin) and
  `nonAdminRequest` (a habitant the test creates) for supertest.
- Existing authorization tests to mimic: `server/test/controllers/serviceSecretRoutes.test.js`,
  `server/test/security/`, `server/test/controllers/gatway.test.js`.

## Reports and patches

- Write in English.
- Give the actor and its trust level (from the table above), the entry point, the file and function, and the impact on
  a real installation.
- The best reproducer is a failing Mocha + supertest test under `server/test/`, mirroring the source path
  (`server/lib/foo/bar.js` → `server/test/lib/foo/bar.test.js`).
- Patches:
  - Keep them minimal, in the style of the surrounding code: Airbnb ESLint with JSDoc on functions, Prettier.
  - Every changed server line must be covered by a test: CI requires 100% patch coverage.
  - Prefer fixing the shared layer (middleware, dispatcher, validator) to patching one route at a time.
  - Do not weaken an existing test.
- Deduplicate by root cause:
  - One missing check in a shared layer, such as the route middleware chain, the Gladys Plus dispatcher or the
    manifest validator, is one report, with the affected routes listed.
  - The same unvalidated value reaching several sinks is one report.
