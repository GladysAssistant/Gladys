# AGENTS.md

## Cursor Cloud specific instructions

Gladys Assistant is a privacy-first smart home platform. The repo has two dev services:

- **server** (`/server`): Node.js + Express REST/WebSocket API on **port 1443**, using SQLite + DuckDB for storage. Started with `nodemon` (hot reload).
- **front** (`/front`): Preact SPA (via `preact-cli`) on **port 1444**, proxying the API at `http://localhost:1443`.

The root `package.json` orchestrates both via `npm-run-all`.

### Running the app (dev mode)

From the repo root: `npm start` (runs `run-p start-server:dev start-front:dev`). The server listens on `http://localhost:1443` and the front dev server on `http://localhost:1444`. Open the front URL; on a fresh DB it starts the onboarding/signup flow (create first admin account → preferences → house/room → dashboard). The server auto-creates/migrates its SQLite DB (`server/gladys-development.db`) on start, so no manual migration is needed for a fresh dev run.

### Non-obvious caveats

- **Front build/dev requires the legacy OpenSSL provider.** All front `build`/`watch`/`start` scripts already set `NODE_OPTIONS=--openssl-legacy-provider` (old webpack in `preact-cli`). Run front commands via the npm scripts, not raw `preact` calls.
- **Harmless startup errors:** on `npm start` you'll see smart-home device discovery errors (e.g. `SonosDiscoveryError: No players found`) because no physical devices exist in the VM/network. These are expected and do not affect the app.
- **Service dependencies:** the server has ~38 integration services under `server/services/*`, each with its own `package.json`. `cd server && npm install` runs a `postinstall` (`cli/install_service_dependencies.js`) that installs deps for every service. Set `INSTALL_SERVICES_SILENT_FAIL=true` so a single flaky service install does not abort the whole install.
- **Native modules** (`sqlite3`, `bcrypt`, `sharp`, `duckdb`, USB/bluetooth services) compile from source; they need build tools (`gcc/g++/make/python3`) and `libudev-dev` on the system.

### Lint / test / build commands

Server (run in `/server`):
- Lint: `npm run eslint` and `npm run prettier-check`
- Test: `npm test` (Mocha; ~4100 tests). Coverage: `npm run coverage`.

Front (run in `/front`):
- Lint: `npm run eslint` and `npm run prettier-check`
- Build: `npm run build` (production bundle to `front/build`)
- Note: the front has **no unit-test script**; CI validates the front via eslint, `compare-translations`, and build only.
