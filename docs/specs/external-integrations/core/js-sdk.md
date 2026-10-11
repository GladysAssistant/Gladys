> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# B.10 JS SDK: dedicated repo `GladysAssistant/integration-sdk-js`

**Dedicated repo from phase 1** (not a monorepo folder): npm versioning independent from the Gladys release cadence, clean CI, and it is the dependency third-party devs install — they never have to touch the monorepo. It depends **only on the C.2–C.4 contracts** (no import of Gladys code).

- **npm package `@gladysassistant/integration-sdk`**: Node ≥ 20, a single runtime dependency (`ws`), TypeScript typings provided (`.d.ts`), CommonJS + ESM. **Full public API specified in C.8.**
- The repo contains **only the library** (+ its tests against a fake server, see B.13): the complete example integration lives in the template repo (B.11). The README keeps a minimal getting-started snippet and points to the template and the website docs (B.12).
- No logging helper: the integration logs to stdout/stderr, retrieved via `docker logs`.
