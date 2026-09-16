> Part of the [external integrations living spec](README.md) — the section index, the editing rules and the cross-repo map are there.

# B.3 Integration auth: stateless JWT, outside `t_session`

`t_session` stays reserved for **user** sessions (it is used to see connections from an unknown browser) — an integration is tied to no user, the two notions are not mixed.

- **One integration JWT per container**: signed HS256 with the existing `jwtSecret` (same mechanics as `server/utils/accessToken.js`, new file `server/utils/integrationToken.js`), payload `{ service_id, token_version }`, `issuer: 'gladys'`, **`audience: 'integration'`** (a user access token can therefore never pass as an integration token, and vice versa), **without expiration** (no `exp` claim): revocation via `token_version` is the only end-of-life mechanism — an expiration would add a failure mode ("the integration dies after N months") with no security benefit.
- **Rotation/revocation via `t_service.token_version`**: the token embeds the current version; the middleware compares it with the column. On every **container recreation**, `token_version` is incremented and a new JWT injected as Env → all old tokens are immediately invalid, without storing any token anywhere (nothing to hash, nothing to revoke row by row). Cost: zero extra query, the middleware must load the `t_service` row anyway to build the tenant context. Uninstall = destroy of the row → the token dies with it.
- New middleware `server/api/middlewares/externalIntegrationAuthMiddleware.js`: verifies signature + audience + `type: 'external'` + `token_version`, loads the row → `req.externalIntegrationService`; new `externalIntegrationAuth: true` flag handled in `server/api/setupRoutes.js` (same mechanics as `alarmAuth`/`resetPasswordAuth`).
- **Tenant isolation (absolute rule)**: the JWT's `service_id` is authoritative, `external_id` forced to the `ext:<selector>:` prefix, ownership checked on every read, variables via `gladys.variable.*(key, service_id)`.
- The token is injected as Env, never displayed again; the "regenerate token" admin action = increment `token_version` + recreate the container.
