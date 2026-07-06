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

## Pull Request requirements (CI)

Every PR to `master` triggers the workflow `.github/workflows/docker-pr-build.yml`. **Run the relevant checks locally before every push** — most first-time CI failures come from skipping them.

### CI jobs overview

| Job | When it runs | What it checks |
|-----|--------------|----------------|
| **Front test** | Always | `prettier-check`, `eslint`, `compare-translations` |
| **Server test** | Always | `prettier-check`, `eslint`, `npm run coverage` + Codecov upload |
| **Cypress run** | Always | E2E tests (signup, dashboard, integrations…) |
| **Front build** | Non-draft PRs only | `npm run build-with-stats` |
| **Docker build** | Non-draft PRs only | AMD64 Docker image build |

Draft PRs skip the front build and Docker jobs. Mark a PR as "Ready for review" only after the build checks pass locally.

### Mandatory checklist before push

**Always (any code change):**

1. Run `npm run prettier` (not just `prettier-check`) in every directory you touched, then verify with `npm run prettier-check`.
2. Run `npm run eslint` in every directory you touched. Use `npm run eslint-fix` (server) if needed.

**If you modified `server/`:**

```bash
cd server
npm run prettier && npm run prettier-check
npm run eslint
npm run coverage   # runs ~4100 Mocha tests + generates coverage report
```

- **Every new or changed server file must have tests.** Place tests in `server/test/` mirroring the source structure (e.g. `server/lib/foo/bar.js` → `server/test/lib/foo/bar.test.js`).
- CI runs `npm run coverage`, not `npm test` alone. Always use `coverage` before pushing.
- **Codecov must pass** (`fail_ci_if_error: true` in CI). There are two separate checks:
  - **Project coverage** (~90% on the whole server codebase — see `codecov.yml`). Legacy untested code is tolerated.
  - **Patch coverage (100%)** — every line you add or modify in the PR must be executed by a test. This is the check that most often fails on agent PRs: one untested line in new code is enough to block the merge.
- When writing server code, assume **100% patch coverage is required**. If you add a branch, error path, or helper, write a test that hits it.
- Do not commit test databases (`gladys-test.db`, `gladys-cypress.db`).

**If you modified `front/`:**

```bash
cd front
npm run prettier && npm run prettier-check
npm run eslint
npm run compare-translations   # required if i18n or device constants changed
npm run build                  # required before marking PR as ready for review
```

- The front has **no unit-test script**. CI validates the front via eslint, `compare-translations`, build, and Cypress.
- If you changed UI routes or components, run Cypress from the repo root:

```bash
npm run cypress:run   # starts server + front, then runs E2E specs in front/cypress/
```

### Common CI failure causes

- **Prettier:** CI uses `prettier-check` (read-only). Run `npm run prettier` locally to auto-fix formatting before pushing.
- **ESLint:** Server uses Airbnb config with JSDoc requirements on exported functions. Front lints `src/` and `cypress/`.
- **Missing translations:** `compare-translations` checks that all `front/src/config/i18n/*.json` files share the same keys, and that `server/utils/constants.js` device features (`DEVICE_FEATURE_UNITS`, `DEVICE_FEATURE_CATEGORIES`, `DEVICE_FEATURE_TYPES`) have matching entries in `en.json`. Adding a key to one language file requires adding it to **all** language files.
- **Codecov patch coverage:** CI uploads the coverage report to Codecov, which measures only the lines changed in your PR. Any new server line not hit by a test fails the `codecov/patch` status. Run `npm run coverage` locally and confirm your tests exercise every branch and path you added before pushing.
- **Server tests:** Changes to `server/lib/`, `server/api/`, `server/controllers/`, or `server/services/` almost always need corresponding tests. Look at neighboring files in `server/test/` for patterns (Mocha + Chai + Sinon).
- **Cypress:** UI changes to signup, dashboard, scenes, or integration pages can break E2E specs under `front/cypress/e2e/`.
- **Front build:** Only runs on non-draft PRs. A webpack/build error will block merge when the PR is marked ready.

### Lint / test / build commands (reference)

Server (run in `/server`):

- Format: `npm run prettier` / `npm run prettier-check`
- Lint: `npm run eslint` / `npm run eslint-fix`
- Test: `npm test` (Mocha; ~4100 tests)
- Coverage (CI command): `npm run coverage`

Front (run in `/front`):

- Format: `npm run prettier` / `npm run prettier-check`
- Lint: `npm run eslint`
- Translations: `npm run compare-translations`
- Build: `npm run build` (production bundle to `front/build`)
- E2E: `npm run cypress:run` (from `/front`, or `npm run cypress:run` from repo root)
