# Intégrations externes dans Gladys Assistant

## Contexte

RFC communautaire (topic 10343) : ouvrir Gladys aux intégrations développées et publiées par n'importe qui, installables en un clic, sans review du mainteneur — sans sacrifier la stabilité. Quatre exigences non négociables : (1) une intégration qui plante ne fait jamais planter Gladys, (2) aucun état zombie (état toujours visible et actionnable dans l'UI), (3) UI cohérente sans code injecté par les intégrations, (4) zéro manipulation technique pour l'utilisateur.

Décisions de cadrage validées avec le mainteneur :
- **Périmètre** : architecture d'ensemble + détail exécutable de la **phase 1** (API-hôte + superviseur Docker + PoC, sans le store).
- **Canal retour core→intégration** : WebSocket sortant depuis l'intégration (pas de serveur HTTP dans le conteneur).
- **SDK v1** : API-hôte REST/WS documentée et ouverte à tous les langages ; SDK officiel + template en Node.js uniquement.

## A. Architecture d'ensemble

```
┌───────────────────── Core Gladys (host network) ─────────────────────┐
│  gladys.externalIntegration (superviseur)   gladys.system (dockerode) │
│   • machine à états + backoff + santé   ──►  • pull/create/stop/logs  │
│   • registre connexions WS intégrations      • + createNetwork (new)  │
│   • proxy-service dans le stateManager                                │
│      ▲ REST /api/integration/v1/*    ▲ WS (auth api_key, commandes)   │
└──────┼───────────────────────────────┼────────────────────────────────┘
       │   réseau bridge dédié `gladys-integrations` (icc désactivé)    │
  ┌── conteneur intégration A ──┐  ┌── conteneur intégration B ──┐
  │  SDK Node (ou tout langage) │  │  ...                        │
  └─────────────────────────────┘  └─────────────────────────────┘
```

- **Superviseur** (`server/lib/external-integration/`) : cycle de vie complet — `Installée → Démarrage → En fonctionnement → Dégradée → En panne → Arrêtée` — persisté en DB et poussé au front en temps réel.
- **API-hôte REST** (`/api/integration/v1/*`) : seule surface intégration→core, délègue aux libs existantes (`gladys.device.create`, `saveState`, `gladys.variable`), isolation « tenant » stricte par clé API.
- **WS intégrations** : extension du `WebsocketManager` existant, auth par api_key ; canal core→intégration (commandes device, ping/pong, config).
- **Manifeste** : JSON embarqué dans l'image Docker (LABEL `io.gladysassistant.manifest`) : nom, version, versions Gladys compatibles, permissions (hôtes réseau, périphériques), schéma de config (phase 2). Champ `manifest_version: 1` figé dès la v1.
- **Pont device** : chaque intégration externe a une ligne `t_service` ; ses devices y sont rattachés et un *proxy service* dans le stateManager rend `device.setValue` fonctionnel **sans modifier le core device**.

### Phases livrables

| Phase | Contenu | Livrable observable |
|---|---|---|
| **1** | API-hôte + WS, superviseur, auth, API admin, page front minimale, SDK Node + PoC. Install « dev » par image Docker. | Un admin colle un nom d'image → l'intégration démarre, crée des devices actionnables, survit à un kill (redémarrage auto), passe « En panne » avec logs après échecs répétés. |
| **2** | Config déclarative : validation `config_schema` (JSON Schema/ajv), formulaires générés côté front, push `CONFIG_UPDATED` par WS. Découverte médiée (mDNS/USB par le core). | Configuration via formulaire généré, sans YAML. |
| **3** | Store intégré : registre distant, catalogue, écran de permissions + avertissement code tiers, mises à jour de version. | Installation en un clic depuis le catalogue. |
| **4** | Publication ouverte : pipeline de publication, SDK/template extraits en repos dédiés, doc publique API-hôte. | N'importe quel dev publie sans review. |

## B. Plan détaillé — Phase 1

### B.1 Modèle de données

- **`server/models/external_integration.js`** (`t_external_integration`) : `id`, `name`, `selector` (unique, préfixe `ext-` pour éviter toute collision avec un futur service natif), `docker_image`, `version`, `manifest` (JSON), `status` (ENUM), `enabled`, `container_id`, `service_id` (FK `t_service`), `api_key_session_id` (FK `t_session`), `failure_count`, `last_heartbeat`. Selector auto via `server/utils/addSelector.js`.
- **Migration** `server/migrations/<timestamp>-create-external-integration.js` (up/down).
- **Rattachement `t_service`** : une ligne `t_service` par intégration (vérifié : `device.setValue.js:15` résout le handler par `device.service.name` dans le stateManager, et `t_device.service_id` est obligatoire — tout le pipeline device existant fonctionne alors sans modification). `service.load.js` n'écrase pas ces lignes (upsert filtré sur les services fichiers).
- **Logs : pas de table.** Logs Docker via `system.getContainerLogs` existant + ring buffer mémoire (~200 entrées) dans le superviseur.
- **Constantes** (`server/utils/constants.js`) : `EXTERNAL_INTEGRATION_STATUS` (+ `_LIST`), `EVENTS.EXTERNAL_INTEGRATION.*`, `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.*` (front : `STATUS_CHANGED`, `NEW_LOG` ; intégration : `COMMAND`, `COMMAND_RESULT`, `HEARTBEAT`, `CONFIG_UPDATED`), `AUTHENTICATION.INTEGRATION_REQUEST`.

### B.2 Superviseur — `server/lib/external-integration/`

Pattern prototype « une fonction par fichier » (comme `server/lib/system/`). Injecté dans `server/lib/index.js`, `init()` appelé après `service.startAll()` (+ flag `disableExternalIntegration` pour les tests).

Fichiers principaux : `index.js` (constructeur : maps connexions WS, commandes en attente, ring buffer, timers), `externalIntegration.init.js` (charge la DB, **réconcilie** les conteneurs par label — cas restore de backup —, enregistre les proxy-services, démarre les intégrations `enabled`), `install.js` (pull → lecture manifeste via labels d'image → validation → création `t_service` + api_key + ligne DB → conteneur → start), `buildContainerDescriptor.js`, `start/stop/restart/uninstall.js` (uninstall : option « conserver les devices »), `saveStatus.js` (DB + `EVENTS.WEBSOCKET.SEND_ALL`), `checkHealth.js` (toutes les 30 s : heartbeat > 60 s ou WS fermé → DEGRADED ; conteneur exité → restart), `scheduleRestart.js` (backoff `min(10s·2^n, 15min)`, `FAILED` après 5 échecs), `integrationConnected/Disconnected.js`, `sendCommand.js` (message_id + ack, **timeout 5 s**), `registerProxyService.js`, `getLogs.js`/`addLog.js`.

**Conteneur verrouillé** (descripteur dockerode) : `ReadonlyRootfs: true`, `CapDrop: ['ALL']`, `SecurityOpt: ['no-new-privileges']`, `Memory`/`MemorySwap` 256 Mo, `NanoCpus` 0,5, `PidsLimit: 100`, bind unique `<basePath>/external-integrations/<selector>:/data` (via `system.getGladysBasePath()`), `Tmpfs /tmp noexec`, `NetworkMode: 'gladys-integrations'`, `RestartPolicy: no` (c'est le superviseur qui redémarre), label `io.gladysassistant.external-integration`. Env : `GLADYS_HOST_API_URL`, `GLADYS_INTEGRATION_API_KEY`, `GLADYS_INTEGRATION_SELECTOR`.

**Ajouts à `server/lib/system/`** : `system.createNetwork.js` (bridge `gladys-integrations`, `enable_icc=false` pour isoler les intégrations entre elles), `system.inspectNetwork.js` (IP gateway pour `GLADYS_HOST_API_URL`), `system.getImageLabels.js` (lecture du manifeste). Gérer via `getNetworkMode()` les deux cas host/bridge du conteneur Gladys.

### B.3 Auth des intégrations

- **Une api_key `t_session` par intégration** (réutilise `session.createApiKey.js`) : scopes `['external-integration', 'ext:<selector>']`, `user_id` = admin installeur, session_id stocké dans `t_external_integration.api_key_session_id` (c'est lui qui porte l'identité tenant). Clé injectée en Env, jamais réaffichée ; action « régénérer » = révoquer + recréer.
- Nouveau `server/lib/session/session.getApiKeySession.js` (retourne la session complète sans casser `validateApiKey`).
- Nouveau middleware `server/api/middlewares/externalIntegrationAuthMiddleware.js` → `req.externalIntegration` ; nouveau flag `externalIntegrationAuth: true` géré dans `server/api/setupRoutes.js` (même mécanique que `alarmAuth`/`resetPasswordAuth`).
- **Isolation tenant (règle absolue)** : `service_id` forcé, `external_id` forcé au préfixe `ext:<selector>:`, ownership vérifié à chaque lecture/suppression, variables via `gladys.variable.*(key, service_id)`. Révocation à la désinstallation.

### B.4 API-hôte REST — `/api/integration/v1/`

Préfixe hors `/api/v1/` utilisateur, versionné par URL. Contrôleur `server/api/controllers/integrationHost.controller.js`, routes dans `server/api/routes.js` :

| Endpoint | Mapping |
|---|---|
| `POST /device` | `gladys.device.create` (upsert par `external_id` — déjà géré) |
| `GET /device`, `DELETE /device/:selector` | filtré/ownership par `service_id` |
| `POST /state` (batch) | `EVENTS.DEVICE.NEW_STATE` (chemin des services natifs) ; rate-limit simple (anti-spam SQLite/DuckDB) |
| `GET/POST /config` | `gladys.variable.getValue/setValue(key, service_id)` (config + secrets en DB core) |
| `POST /logs` | logger + ring buffer + push front |
| `POST /heartbeat`, `GET /status` | fallback HTTP + statut au boot du SDK |

Ne **pas** exposer ces routes via le gateway Gladys Plus (`setupGateway`).

### B.5 WebSocket intégrations

Étendre `server/api/websockets/index.js` (même WSS, nouveau `case` dans le switch) : message `AUTHENTICATION.INTEGRATION_REQUEST { apiKey }` → validation scope `external-integration` → `gladys.externalIntegration.integrationConnected(integration, ws)`. Heartbeat : `ws.ping()` toutes les 20 s + flag `isAlive` sur `pong` + message applicatif `HEARTBEAT` (maj `last_heartbeat`) ; 2 pings manqués → DEGRADED. Descendant : `COMMAND { message_id, ... }` avec ack `COMMAND_RESULT`. Reconnexion gérée par le SDK (backoff), une reconnexion remplace l'ancienne entrée.

### B.6 Routing des commandes

Aucune modification de `device.setValue.js` : `registerProxyService.js` pose dans le stateManager, sous le nom du `t_service` de l'intégration, un objet gelé `{ device: { setValue: (...) => sendCommand(...) } }`. `sendCommand` → WS + ack (timeout 5 s → throw, ex. nouvelle `ExternalIntegrationUnavailableError` dans `utils/coreErrors.js`) ; intégration déconnectée → throw immédiat. Retour d'état réel via `POST /state` (documenter `has_feedback: true` pour les features actionnables).

### B.7 API de gestion (admin)

`server/api/controllers/externalIntegration.controller.js`, routes `authenticated + admin` : `POST /api/v1/external_integration` (`{ docker_image, manifest? }`, manifest inline = mode dev), `GET` liste/détail/logs, `POST .../start|stop|restart`, `DELETE` (`?delete_devices=true`).

### B.8 Front minimal

Dans **Paramètres** (le catalogue d'intégrations viendra avec le store en phase 3) : `front/src/routes/settings/settings-external-integrations/` (page liste + badge d'état temps réel via WS `STATUS_CHANGED`, actions start/stop/restart/désinstaller, modal logs, formulaire « installer depuis une image Docker » avec avertissement code non audité). Route dans `front/src/components/app.jsx`, entrée dans le menu settings. Modèles : `front/src/routes/integration/all/mcp/` (appels API) et `settings-system` (structure). i18n dans **toutes** les langues (`front/src/config/i18n/*.json`, check `compare-translations`).

### B.9 SDK Node.js + PoC

- Dossier racine `integration-sdk/` du monorepo en phase 1 (`node/` = futur paquet npm `@gladysassistant/integration-sdk`, `examples/demo/` = PoC) ; extraction en repos dédiés en phase 4. Package.json propre, hors lint/coverage serveur.
- SDK : classe `GladysIntegration` — lit les env vars, client REST (fetch), WS avec auth + reconnexion + pings, helpers `declareDevice`, `publishState`, `onCommand` (ack auto), `getConfig/setConfig`, `log`.
- **PoC `gladys-integration-demo`** (testable sans matériel, couvre les deux sens) : température Open-Meteo (API publique sans clé) publiée toutes les 10 min + interrupteur virtuel (reçoit `onCommand`, republie l'état). Dockerfile `node:22-alpine`, `USER node`, compatible rootfs read-only. Manifeste dans le LABEL.

### B.10 Tests (patch coverage 100 % exigé en CI)

- Superviseur : `server/test/lib/external-integration/` (un fichier par fonction), Docker mocké via `server/test/lib/system/DockerodeMock.test.js` à étendre (createNetwork, getImage().inspect avec Labels) ou fakes sinon de `gladys.system.*`.
- Contrôleurs : supertest ; API-hôte appelée avec le header api_key brut (pas `authenticatedRequest`). **Tests d'isolation tenant obligatoires** (clé A ≠ devices de B, préfixe `external_id` rejeté).
- Middleware : 401 (clé absente/révoquée/mauvais scope). WS : auth OK/KO, commande + ack + timeout (étendre `server/test/websockets/`).
- SDK/PoC : suite Mocha propre dans `integration-sdk/node`, hors CI serveur.

### B.11 Risques assumés (v1)

1. **Egress réseau** : Docker ne filtre pas par hôte. V1 : bridge dédié + `enable_icc=false` + `network_hosts` du manifeste affichés comme transparence, **non appliqués techniquement** (documenté honnêtement). Piste phase 3/4 : proxy sidecar ou nftables.
2. **Sans socket Docker** (dev, installs exotiques) : `PlatformNotCompatible` déjà levée par `system.*` → superviseur no-op + « non disponible » dans l'UI + mode dev SDK hors Docker documenté (api_key manuelle).
3. **Secrets en Env** : visibles via `docker inspect` (qui suppose déjà l'accès à la socket = root de fait). Acceptable v1, clé scoppée et révocable.
4. **Backup/restore** : `container_id` obsolète après restore → réconciliation par label au boot ; `/data` du conteneur hors backup DB (documenter : persister l'important via `/config`).

## Ordre d'implémentation (jalons PR-ables)

1. **PR 1 — Socle superviseur** : constantes, migration + modèle, `system.createNetwork|inspectNetwork|getImageLabels`, lib `external-integration` (sans WS/commandes), câblage `lib/index.js`, API admin + tests. → on installe/démarre/arrête un conteneur verrouillé via l'API.
2. **PR 2 — API-hôte** : `session.getApiKeySession`, middleware, flag `externalIntegrationAuth`, contrôleur `/api/integration/v1/*` + tests d'isolation. → une intégration crée des devices et publie des états.
3. **PR 3 — WS + commandes + santé** : extension WebsocketManager, connected/disconnected, `sendCommand` + ack/timeout, proxy-service, heartbeat, checkHealth + backoff + DEGRADED/FAILED. → machine à états complète, `setValue` atteint le conteneur.
4. **PR 4 — Front** : page settings, temps réel, logs, install dev, i18n.
5. **PR 5 — SDK + PoC + doc** : `integration-sdk/node`, exemple demo, doc API-hôte, parcours e2e documenté.

## Fichiers critiques existants

- `server/lib/system/index.js` (+ `system.createContainer.js`, `system.getContainerLogs.js`) — socle Docker à étendre
- `server/lib/device/device.setValue.js` — contrat de dispatch respecté via le proxy-service
- `server/api/websockets/index.js` — extension auth api_key
- `server/api/routes.js` + `server/api/setupRoutes.js` — nouveau flag d'auth et routes
- `server/lib/index.js` — injection du superviseur dans l'objet gladys
- `server/lib/session/session.createApiKey.js` / `session.validateApiKey.js` — auth réutilisée
- `server/services/zigbee2mqtt/docker/*.json` — format de descripteur de conteneur de référence
- `front/src/routes/integration/all/mcp/` — modèle de page front

## Vérification

1. `cd server && npm test` (patch coverage 100 %), `npm run compare-translations` côté front, lint des deux workspaces.
2. **Parcours e2e manuel** (environnement avec socket Docker) : build de l'image `gladys-integration-demo` → installation via la page settings → statut passe `Démarrage → En fonctionnement` en temps réel → devices demo visibles dans le dashboard → actionner l'interrupteur virtuel (commande reçue dans les logs du conteneur, état republié) → `docker kill` du conteneur → statut `Dégradée` puis redémarrage auto → forcer 5 crashs → statut `En panne` avec logs visibles et bouton redémarrer → désinstallation propre (conteneur supprimé, clé révoquée).
3. Test d'isolation manuel : appeler l'API-hôte avec la clé d'une intégration sur les devices d'une autre → 403/404.
