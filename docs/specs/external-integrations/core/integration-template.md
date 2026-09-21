> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# B.11 Integration template: dedicated repo `GladysAssistant/integration-template-js`

Public repo marked as a **GitHub "Template repository"** from its creation: "Use this template" + edit the manifest + tag the topic = being in the store. It is both the **official starting point** for a third-party dev and the **PoC** used in the e2e journey (`../verification.md`) — it is published in the store exactly as a third-party dev would (topic + image on a public registry), which validates the "zero approval" path end to end.

**Content = a complete, working integration** (testable without hardware, covers the whole cycle including the 3 screens): publishes two discovered devices — an Open-Meteo temperature sensor (public API, no key) and a virtual switch. The user creates them from the Discovery screen; the integration then publishes the temperature every 10 min and responds to the switch's commands (receives `onSetValue`, republishes the state). Its manifest embeds a `config_schema` (latitude/longitude + refresh interval) to exercise the Configuration screen's generated form and `onConfigUpdated`.

Repo files:
- `index.js`: the demo integration, built on `@gladysassistant/integration-sdk` (~40 lines, see C.8); during the parallel development of the workstreams, dependency installed from the SDK's git repo, switched to the npm version before publication;
- `gladys-assistant-integration.json` at the root (manifest compliant with C.1, including the name/description bounds) + a compliant `cover.jpg` (800×534, ≤ 150 KB);
- `docs/en.md` + `docs/fr.md` pre-filled: this is **the official template for the store's mandatory documentation** (B.9) — Overview / Prerequisites / Configuration / Troubleshooting sections, to adapt;
- `Dockerfile`: `node:22-alpine`, `USER node`, compatible with a read-only rootfs (C.7), copies the manifest into the `io.gladysassistant.manifest` LABEL at build time;
- a ready-to-use GitHub Actions workflow: **multi-arch `linux/amd64` + `linux/arm64` build via buildx** (see B.14.7), push to GHCR on git tag — a third-party dev publishes without writing a line of CI;
- a short `README`: "publish your integration in 5 steps", pointing to the website's developer docs (B.12) for the details.
