# Intégrations externes dans Gladys Assistant

## Contexte

RFC communautaire (topic 10343) : ouvrir Gladys aux intégrations développées et publiées par n'importe qui, installables en un clic, sans review du mainteneur — sans sacrifier la stabilité. Quatre exigences non négociables : (1) une intégration qui plante ne fait jamais planter Gladys, (2) aucun état zombie (état toujours visible et actionnable dans l'UI), (3) UI cohérente sans code injecté par les intégrations, (4) zéro manipulation technique pour l'utilisateur.

Décisions de cadrage validées avec le mainteneur :
- **Périmètre** : architecture d'ensemble + détail exécutable de la **phase 1** (API-hôte + superviseur Docker + PoC, sans le store).
- **Canal retour core→intégration** : WebSocket sortant depuis l'intégration (pas de serveur HTTP dans le conteneur).
- **SDK v1** : API-hôte REST/WS documentée et ouverte à tous les langages ; SDK officiel + template en Node.js uniquement.
- **Pas de création de device par l'intégration** : elle publie des appareils découverts, l'utilisateur crée/modifie/supprime depuis l'interface (pattern des intégrations internes).
- **Modèle de données fusionné** : pas de table dédiée — une intégration externe **est** une ligne `t_service` (colonne `type`), pour éviter toute double identité à synchroniser.
- **Auth par JWT d'intégration stateless** : non lié à un user, hors `t_session` (réservée aux sessions utilisateur), régénéré à chaque recréation du conteneur.

## A. Architecture d'ensemble

```
┌───────────────────── Core Gladys (host network) ─────────────────────┐
│  gladys.externalIntegration (superviseur)   gladys.system (dockerode) │
│   • machine à états + backoff + santé   ──►  • pull/create/stop/logs  │
│   • registre connexions WS intégrations      • + createNetwork (new)  │
│   • proxy-service dans le stateManager                                │
│      ▲ REST /api/integration/v1/*    ▲ WS (auth JWT, commandes)       │
└──────┼───────────────────────────────┼────────────────────────────────┘
       │   réseau bridge dédié `gladys-integrations` (icc désactivé)    │
  ┌── conteneur intégration A ──┐  ┌── conteneur intégration B ──┐
  │  SDK Node (ou tout langage) │  │  ...                        │
  └─────────────────────────────┘  └─────────────────────────────┘
```

- **Superviseur** (`server/lib/external-integration/`) : cycle de vie complet — `Installée → Démarrage → En fonctionnement → Dégradée → En panne → Arrêtée` — persisté en DB et poussé au front en temps réel.
- **API-hôte REST** (`/api/integration/v1/*`) : seule surface intégration→core, délègue aux libs existantes (`saveState`, `gladys.variable`), isolation « tenant » stricte par JWT d'intégration. **L'intégration ne crée ni ne supprime jamais de device** : elle publie des *appareils découverts*, et c'est l'utilisateur qui crée/modifie/supprime depuis l'interface (même pattern que les intégrations internes avec leur onglet « Découverte »).
- **WS intégrations** : extension du `WebsocketManager` existant, auth par JWT d'intégration ; canal core→intégration (commandes device, demandes de scan, notifications de cycle de vie des devices, ping/pong, config).
- **Manifeste** : JSON embarqué dans l'image Docker (LABEL `io.gladysassistant.manifest`) : nom, version, versions Gladys compatibles, permissions (hôtes réseau, périphériques), schéma de config (phase 2). Champ `manifest_version: 1` figé dès la v1.
- **Une intégration externe est un service** : ligne `t_service` avec `type: 'external'`, devices rattachés normalement, et un *proxy service* dans le stateManager (start/stop/setValue) qui l'insère dans le cycle de vie existant **sans modifier le core device ni le core service**.

### Phases livrables

| Phase | Contenu | Livrable observable |
|---|---|---|
| **1** | API-hôte + WS, superviseur, auth, API admin, page front minimale (gestion + onglet Découverte générique), SDK Node + PoC. Install « dev » par image Docker. | Un admin colle un nom d'image → l'intégration démarre, publie ses appareils découverts, l'utilisateur les crée depuis l'UI et les actionne ; l'intégration survit à un kill (redémarrage auto), passe « En panne » avec logs après échecs répétés. |
| **2** | Config déclarative : validation `config_schema` (JSON Schema/ajv), formulaires générés côté front, push `CONFIG_UPDATED` par WS. Découverte médiée (mDNS/USB par le core). | Configuration via formulaire généré, sans YAML. |
| **3** | Store intégré : registre distant, catalogue, écran de permissions + avertissement code tiers, mises à jour de version. | Installation en un clic depuis le catalogue. |
| **4** | Publication ouverte : pipeline de publication, SDK/template extraits en repos dédiés, doc publique API-hôte. | N'importe quel dev publie sans review. |

## B. Plan détaillé — Phase 1

### B.1 Modèle de données : tout dans `t_service`

**Pas de table dédiée.** Une intégration externe est une ligne `t_service` — c'est conceptuellement la même chose qu'un service interne, et ça évite la double identité à synchroniser (statut, version, nom dans deux tables). Vérifié dans le code :
- `service.load.js:14` n'itère que sur les clés de `servicesFromFiles` → les lignes créées dynamiquement ne sont jamais touchées/écrasées au boot ;
- `service.startAll.js:20` itère sur le stateManager et appelle `start()` → si le proxy-service expose `start()`/`stop()` délégant au superviseur, les intégrations externes s'insèrent **gratuitement** dans le cycle de vie existant (y compris la règle « `STOPPED` = ignoré au démarrage », qui remplace la colonne `enabled` initialement envisagée) ;
- `t_service` a déjà `version`, `status`, et `pod_id` (aligné avec les intégrations déportées évoquées par la RFC).

**Migration `addColumn` sur `t_service`** (`server/migrations/<timestamp>-add-external-integration-columns.js`, + mise à jour de `server/models/service.js`) :

| Colonne | Type | Rôle |
|---|---|---|
| `type` | ENUM `('internal','external')`, défaut `'internal'` | ENUM plutôt que boolean : un futur type (`'remote'` déporté…) rentre sans migration (TEXT sous SQLite) |
| `docker_image` | STRING nullable | image:tag installée |
| `manifest` | JSON nullable | manifeste complet |
| `container_id` | STRING nullable | id Docker courant |
| `failure_count` | INTEGER défaut 0 | compteur backoff |
| `last_heartbeat` | DATE nullable | |
| `token_version` | INTEGER défaut 0 | invalidation des JWT d'intégration (voir B.3) |

Toutes nullables/défaut pour les services internes existants. `name`/`selector` avec préfixe `ext-` pour éviter toute collision avec un futur service natif (`service.load` cherche par `(pod_id: null, name)`).

- **Statuts** : réutiliser `SERVICE_STATUS` existant en y ajoutant **une seule valeur : `DEGRADED`**. Projection de la machine à états RFC : Installée→`ENABLED`, Démarrage→`LOADING`, En fonctionnement→`RUNNING`, Dégradée→`DEGRADED`, En panne→`ERROR`, Arrêtée→`STOPPED`.
- **Logs : ni table, ni push.** L'intégration écrit sur stdout/stderr ; Gladys consulte les logs à la demande via l'API Docker (`system.getContainerLogs(container_id)` existant, équivalent `docker logs`).
- **Constantes** (`server/utils/constants.js`) : `SERVICE_STATUS.DEGRADED`, `SERVICE_TYPES`, `EVENTS.EXTERNAL_INTEGRATION.*`, `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.*` (front : `STATUS_CHANGED`, `DISCOVERED_DEVICES_UPDATED` ; intégration : `COMMAND`, `COMMAND_RESULT`, `SCAN_REQUEST`, `DEVICE_CREATED`, `DEVICE_UPDATED`, `DEVICE_DELETED`, `HEARTBEAT`, `CONFIG_UPDATED`), `AUTHENTICATION.INTEGRATION_REQUEST`.
- **Appareils découverts : pas de table.** La liste des appareils découverts publiée par chaque intégration est tenue **en mémoire** dans le superviseur (comme le font les handlers des services internes, ex. philips-hue), perdue au redémarrage et republiée par l'intégration à sa connexion.

### B.2 Superviseur — `server/lib/external-integration/`

Pattern prototype « une fonction par fichier » (comme `server/lib/system/`). Injecté dans `server/lib/index.js` (avec le `jwtSecret`, comme `Session`) ; `init()` appelé **avant** `service.startAll()` : il enregistre les proxy-services dans le stateManager, et `startAll` démarre alors intégrations internes et externes par le même chemin (+ flag `disableExternalIntegration` pour les tests).

Fichiers principaux : `index.js` (constructeur : maps connexions WS, commandes en attente, timers), `externalIntegration.init.js` (charge les `t_service` de type `external`, **réconcilie** les conteneurs par label — cas restore de backup —, enregistre les proxy-services), `install.js` (pull → lecture manifeste via labels d'image → validation → création ligne `t_service` type `external` → génération du JWT (B.3) → conteneur → start), `buildContainerDescriptor.js`, `start/stop/restart/uninstall.js` (start/stop appelés aussi via le proxy-service par le cycle de vie standard ; uninstall : stop + suppression conteneur + destroy `t_service`, option « conserver les devices »), `saveStatus.js` (update `t_service.status` + `EVENTS.WEBSOCKET.SEND_ALL`), `checkHealth.js` (toutes les 30 s : heartbeat > 60 s ou WS fermé → DEGRADED ; conteneur exité → restart), `scheduleRestart.js` (backoff `min(10s·2^n, 15min)`, `ERROR` après 5 échecs), `integrationConnected/Disconnected.js`, `sendCommand.js` (message_id + ack, **timeout 5 s**), `registerProxyService.js`, `getLogs.js` (simple délégation à `system.getContainerLogs(container_id)`).

**Conteneur verrouillé** (descripteur dockerode) : `ReadonlyRootfs: true`, `CapDrop: ['ALL']`, `SecurityOpt: ['no-new-privileges']`, `Memory`/`MemorySwap` 256 Mo, `NanoCpus` 0,5, `PidsLimit: 100`, bind unique `<basePath>/external-integrations/<selector>:/data` (via `system.getGladysBasePath()`), `Tmpfs /tmp noexec`, `NetworkMode: 'gladys-integrations'`, `RestartPolicy: no` (c'est le superviseur qui redémarre), label `io.gladysassistant.external-integration`. Env : `GLADYS_HOST_API_URL`, `GLADYS_INTEGRATION_TOKEN` (JWT, régénéré à chaque recréation du conteneur), `GLADYS_INTEGRATION_SELECTOR`.

**Ajouts à `server/lib/system/`** : `system.createNetwork.js` (bridge `gladys-integrations`, `enable_icc=false` pour isoler les intégrations entre elles), `system.inspectNetwork.js` (IP gateway pour `GLADYS_HOST_API_URL`), `system.getImageLabels.js` (lecture du manifeste). Gérer via `getNetworkMode()` les deux cas host/bridge du conteneur Gladys.

### B.3 Auth des intégrations : JWT stateless, hors `t_session`

`t_session` reste réservée aux sessions **utilisateur** (elle sert à voir les connexions depuis un navigateur inconnu) — une intégration n'est liée à aucun user, on ne mélange pas les deux notions.

- **Un JWT d'intégration par conteneur** : signé HS256 avec le `jwtSecret` existant (même mécanique que `server/utils/accessToken.js`, nouveau fichier `server/utils/integrationToken.js`), payload `{ service_id, token_version }`, `issuer: 'gladys'`, **`audience: 'integration'`** (un access token utilisateur ne peut donc jamais passer pour un token d'intégration, et inversement), longue durée de vie.
- **Rotation/révocation via `t_service.token_version`** : le token embarque la version courante ; le middleware compare avec la colonne. À chaque **recréation du conteneur**, on incrémente `token_version` et on injecte un nouveau JWT en Env → tous les anciens tokens sont immédiatement invalides, sans stocker aucun token nulle part (rien à hasher, rien à révoquer ligne par ligne). Coût : zéro requête supplémentaire, le middleware doit de toute façon charger la ligne `t_service` pour construire le contexte tenant. Désinstallation = destroy de la ligne → le token meurt avec.
- Nouveau middleware `server/api/middlewares/externalIntegrationAuthMiddleware.js` : vérifie signature + audience + `type: 'external'` + `token_version`, charge la ligne → `req.externalIntegrationService` ; nouveau flag `externalIntegrationAuth: true` géré dans `server/api/setupRoutes.js` (même mécanique que `alarmAuth`/`resetPasswordAuth`).
- **Isolation tenant (règle absolue)** : `service_id` du JWT fait foi, `external_id` forcé au préfixe `ext:<selector>:`, ownership vérifié à chaque lecture, variables via `gladys.variable.*(key, service_id)`.
- Le token est injecté en Env, jamais réaffiché ; action admin « régénérer le token » = incrémenter `token_version` + recréer le conteneur.

### B.4 API-hôte REST — `/api/integration/v1/`

Préfixe hors `/api/v1/` utilisateur, versionné par URL. Contrôleur `server/api/controllers/integrationHost.controller.js`, routes dans `server/api/routes.js` :

**L'API-hôte ne permet ni création ni suppression de device.** L'intégration publie ses appareils découverts ; la création/modification/suppression reste un geste utilisateur dans l'UI (via le `POST /api/v1/device` standard, comme pour les intégrations internes).

| Endpoint | Mapping |
|---|---|
| `POST /discovered_device` (batch, remplace la liste) | stocké en mémoire par le superviseur (`external_id` préfixés `ext:<selector>:` forcés) ; push front `DISCOVERED_DEVICES_UPDATED` ; le superviseur marque ceux déjà créés en DB (match `external_id`) |
| `GET /device` | **lecture seule** : les devices de l'intégration réellement créés par l'utilisateur (`service_id` forcé) — permet à l'intégration de savoir quoi piloter/poller au démarrage |
| `POST /state` (batch) | `EVENTS.DEVICE.NEW_STATE` (chemin des services natifs) ; rate-limit simple (anti-spam SQLite/DuckDB) |
| `GET/POST /config` | `gladys.variable.getValue/setValue(key, service_id)` (config + secrets en DB core) |
| `POST /heartbeat`, `GET /status` | fallback HTTP + statut au boot du SDK |

**Pas d'endpoint de logs** : l'intégration ne pousse pas ses logs, elle écrit simplement sur stdout/stderr et Gladys les consulte via l'API Docker (`system.getContainerLogs(container_id)` existant, équivalent `docker logs`). Beaucoup plus simple, et ça marche dans tous les langages sans SDK.

Ne **pas** exposer ces routes via le gateway Gladys Plus (`setupGateway`).

### B.5 WebSocket intégrations

Étendre `server/api/websockets/index.js` (même WSS, nouveau `case` dans le switch) : message `AUTHENTICATION.INTEGRATION_REQUEST { token }` → validation du JWT d'intégration (signature + audience + `token_version`, cf. B.3) → `gladys.externalIntegration.integrationConnected(service, ws)`. Heartbeat : `ws.ping()` toutes les 20 s + flag `isAlive` sur `pong` + message applicatif `HEARTBEAT` (maj `last_heartbeat`) ; 2 pings manqués → DEGRADED. Reconnexion gérée par le SDK (backoff), une reconnexion remplace l'ancienne entrée.

Messages descendants (core→intégration) :
- `COMMAND { message_id, ... }` avec ack `COMMAND_RESULT` (voir B.6) ;
- `SCAN_REQUEST` : demande de (re)découverte déclenchée depuis l'onglet Découverte de l'UI — l'intégration répond en republiant via `POST /discovered_device` ;
- `DEVICE_CREATED` / `DEVICE_UPDATED` / `DEVICE_DELETED { device }` : relayés par les hooks `postCreate`/`postUpdate`/`postDelete` du proxy-service — le core les appelle déjà sur le service propriétaire à chaque geste utilisateur (vérifié : `server/lib/device/device.notify.js`). L'intégration sait ainsi immédiatement quels appareils suivre ou abandonner, sans polling.

### B.6 Routing des commandes

Aucune modification de `device.setValue.js` ni de `device.notify.js` : `registerProxyService.js` pose dans le stateManager, sous le nom du `t_service` de l'intégration, un objet gelé `{ device: { setValue, postCreate, postUpdate, postDelete } }` — `setValue` route les commandes, les trois hooks relaient les notifications de cycle de vie (B.5). `sendCommand` → WS + ack (timeout 5 s → throw, ex. nouvelle `ExternalIntegrationUnavailableError` dans `utils/coreErrors.js`) ; intégration déconnectée → throw immédiat. Retour d'état réel via `POST /state` (documenter `has_feedback: true` pour les features actionnables).

### B.7 API de gestion (admin)

`server/api/controllers/externalIntegration.controller.js`, routes `authenticated + admin` : `POST /api/v1/external_integration` (`{ docker_image, manifest? }`, manifest inline = mode dev), `GET` liste/détail/logs, `POST .../start|stop|restart`, `DELETE` (`?delete_devices=true`). Ces endpoints opèrent sur les lignes `t_service` de type `external` (pas de nouvelle table) ; la liste peut à terme converger avec la page settings-service existante.

Pour l'onglet Découverte (auth utilisateur standard, non admin) : `GET /api/v1/external_integration/:selector/discovered_device` (liste mémoire du superviseur, avec le flag « déjà créé ») et `POST .../scan` (envoie `SCAN_REQUEST` à l'intégration). La création du device se fait ensuite par le `POST /api/v1/device` existant, comme pour les intégrations internes.

### B.8 Front minimal

Dans **Paramètres** (le catalogue d'intégrations viendra avec le store en phase 3) : `front/src/routes/settings/settings-external-integrations/` (page liste + badge d'état temps réel via WS `STATUS_CHANGED`, actions start/stop/restart/désinstaller, modal logs, formulaire « installer depuis une image Docker » avec avertissement code non audité). Route dans `front/src/components/app.jsx`, entrée dans le menu settings. Modèles : `front/src/routes/integration/all/mcp/` (appels API) et `settings-system` (structure). i18n dans **toutes** les langues (`front/src/config/i18n/*.json`, check `compare-translations`).

S'y ajoute un **onglet « Découverte » générique** par intégration (même UX que les onglets Découverte des intégrations internes, ex. Philips Hue) : liste des appareils découverts (nom, features, badge « déjà créé »), bouton « Scanner » (`POST .../scan`), bouton « Créer » par appareil qui appelle le `POST /api/v1/device` standard, rafraîchissement temps réel via `DISCOVERED_DEVICES_UPDATED`. Un seul composant générique sert toutes les intégrations externes — cohérent avec le principe « UI déclarative » de la RFC. La modification/suppression passe ensuite par les écrans device existants.

### B.9 SDK Node.js + PoC

- Dossier racine `integration-sdk/` du monorepo en phase 1 (`node/` = futur paquet npm `@gladysassistant/integration-sdk`, `examples/demo/` = PoC) ; extraction en repos dédiés en phase 4. Package.json propre, hors lint/coverage serveur.
- SDK : classe `GladysIntegration` — lit les env vars, client REST (fetch), WS avec auth + reconnexion + pings, helpers `publishDiscoveredDevices(devices)`, `getDevices()` (devices créés par l'utilisateur), `publishState`, `onCommand` (ack auto), `onScanRequest`, `onDeviceCreated/Updated/Deleted`, `getConfig/setConfig`. Pas de helper de logs : l'intégration loggue sur stdout/stderr, récupérés par `docker logs`.
- **PoC `gladys-integration-demo`** (testable sans matériel, couvre tout le cycle) : publie deux appareils découverts — un capteur température Open-Meteo (API publique sans clé) et un interrupteur virtuel. L'utilisateur les crée depuis l'onglet Découverte ; l'intégration publie alors la température toutes les 10 min et répond aux commandes de l'interrupteur (reçoit `onCommand`, republie l'état). Dockerfile `node:22-alpine`, `USER node`, compatible rootfs read-only. Manifeste dans le LABEL.

### B.10 Tests (patch coverage 100 % exigé en CI)

- Superviseur : `server/test/lib/external-integration/` (un fichier par fonction), Docker mocké via `server/test/lib/system/DockerodeMock.test.js` à étendre (createNetwork, getImage().inspect avec Labels) ou fakes sinon de `gladys.system.*`.
- Contrôleurs : supertest ; API-hôte appelée avec un JWT d'intégration généré en seed (pas `authenticatedRequest`, qui est un token utilisateur). **Tests d'isolation tenant obligatoires** (token de A ≠ devices de B, préfixe `external_id` rejeté, access token utilisateur refusé sur l'API-hôte — mauvaise audience).
- Middleware : 401 (token absent/signature invalide/mauvaise audience/`token_version` obsolète/service non externe). WS : auth OK/KO, commande + ack + timeout (étendre `server/test/websockets/`).
- SDK/PoC : suite Mocha propre dans `integration-sdk/node`, hors CI serveur.

### B.11 Risques assumés (v1)

1. **Egress réseau** : Docker ne filtre pas par hôte. V1 : bridge dédié + `enable_icc=false` + `network_hosts` du manifeste affichés comme transparence, **non appliqués techniquement** (documenté honnêtement). Piste phase 3/4 : proxy sidecar ou nftables.
2. **Sans socket Docker** (dev, installs exotiques) : `PlatformNotCompatible` déjà levée par `system.*` → superviseur no-op + « non disponible » dans l'UI + mode dev SDK hors Docker documenté (endpoint admin pour générer un JWT d'intégration de dev).
3. **Secrets en Env** : le JWT est visible via `docker inspect` (qui suppose déjà l'accès à la socket = root de fait). Acceptable v1 : token scoppé à une seule intégration et invalidable instantanément via `token_version`.
4. **Backup/restore** : `container_id` obsolète après restore → réconciliation par label au boot ; `/data` du conteneur hors backup DB (documenter : persister l'important via `/config`).

## Ordre d'implémentation (jalons PR-ables)

1. **PR 1 — Socle superviseur** : constantes (`SERVICE_TYPES`, `SERVICE_STATUS.DEGRADED`), migration `addColumn` sur `t_service` + modèle, `system.createNetwork|inspectNetwork|getImageLabels`, lib `external-integration` (sans WS/commandes), câblage `lib/index.js`, API admin + tests. → on installe/démarre/arrête un conteneur verrouillé via l'API.
2. **PR 2 — API-hôte** : `utils/integrationToken.js` (génération/validation JWT), middleware, flag `externalIntegrationAuth`, contrôleur `/api/integration/v1/*` (discovered_device, device en lecture, state, config) + tests d'isolation. → une intégration publie ses appareils découverts et des états.
3. **PR 3 — WS + commandes + santé** : extension WebsocketManager, connected/disconnected, `sendCommand` + ack/timeout, proxy-service (setValue + postCreate/postUpdate/postDelete), scan request, heartbeat, checkHealth + backoff + DEGRADED/FAILED. → machine à états complète, `setValue` atteint le conteneur, l'intégration est notifiée des créations/suppressions.
4. **PR 4 — Front** : page settings, onglet Découverte générique, temps réel, logs, install dev, i18n.
5. **PR 5 — SDK + PoC + doc** : `integration-sdk/node`, exemple demo, doc API-hôte, parcours e2e documenté.

## Fichiers critiques existants

- `server/lib/system/index.js` (+ `system.createContainer.js`, `system.getContainerLogs.js`) — socle Docker à étendre
- `server/lib/device/device.setValue.js` + `device.notify.js` — contrats de dispatch et de notification respectés via le proxy-service
- `server/api/websockets/index.js` — extension auth JWT d'intégration
- `server/api/routes.js` + `server/api/setupRoutes.js` — nouveau flag d'auth et routes
- `server/lib/index.js` — injection du superviseur (avec `jwtSecret`) dans l'objet gladys
- `server/lib/service/service.load.js` / `service.startAll.js` — cycle de vie réutilisé tel quel (vérifié compatible avec les lignes `t_service` externes)
- `server/utils/accessToken.js` — modèle pour `utils/integrationToken.js` (JWT audience `integration`)
- `server/models/service.js` — colonnes à ajouter
- `server/services/zigbee2mqtt/docker/*.json` — format de descripteur de conteneur de référence
- `front/src/routes/integration/all/mcp/` — modèle de page front

## Vérification

1. `cd server && npm test` (patch coverage 100 %), `npm run compare-translations` côté front, lint des deux workspaces.
2. **Parcours e2e manuel** (environnement avec socket Docker) : build de l'image `gladys-integration-demo` → installation via la page settings → statut passe `Démarrage → En fonctionnement` en temps réel → les appareils demo apparaissent dans l'onglet Découverte → création depuis l'UI → l'intégration reçoit `DEVICE_CREATED` et publie ses états, devices visibles dans le dashboard → actionner l'interrupteur virtuel (commande reçue dans les logs du conteneur, état republié) → `docker kill` du conteneur → statut `Dégradée` puis redémarrage auto → forcer 5 crashs → statut `En panne` avec logs visibles et bouton redémarrer → désinstallation propre (conteneur supprimé, ligne `t_service` détruite, ancien JWT refusé).
3. Test d'isolation manuel : appeler l'API-hôte avec le token d'une intégration sur les devices d'une autre → 403/404 ; avec un access token utilisateur → 401 (mauvaise audience) ; avec un token d'ancienne `token_version` après recréation du conteneur → 401.
