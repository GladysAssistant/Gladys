> Part of the [external integrations living spec](README.md) — the section index, the editing rules and the cross-repo map are there.

# C.2 Host API: access conventions

- Base: `GLADYS_HOST_API_URL` (injected env, e.g. `http://172.18.0.1:80`) + the **`/api/integration/v1`** prefix.
- Auth: **`Authorization: Bearer <GLADYS_INTEGRATION_TOKEN>`** header (JWT injected as env, see B.3). Absent/invalid/wrong audience/stale `token_version` → `401 UNAUTHORIZED`.
- **No integration selector in the URLs**: identity comes from the JWT (`service_id` in the payload), each integration only sees its own perimeter. Putting the selector in the URL would be redundant — the server would have to verify it matches the token anyway — and would create a needless error surface (URL/token mismatch). It is the "the API talks to *the authenticated integration*" pattern, like a `/me`.
