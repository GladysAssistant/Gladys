# Intégrations externes dans Gladys Assistant

## Contexte

RFC communautaire (topic 10343) : ouvrir Gladys aux intégrations développées et publiées par n'importe qui, installables en un clic, sans review du mainteneur — sans sacrifier la stabilité. Quatre exigences non négociables : (1) une intégration qui plante ne fait jamais planter Gladys, (2) aucun état zombie (état toujours visible et actionnable dans l'UI), (3) UI cohérente sans code injecté par les intégrations, (4) zéro manipulation technique pour l'utilisateur.

Décisions de cadrage validées avec le mainteneur :
- **Périmètre** : architecture d'ensemble + détail exécutable de la **phase 1** (API-hôte + superviseur Docker + PoC + **store**).
- **Store décentralisé, zéro approbation** : la source de vérité est le topic GitHub `gladys-assistant-integration` (publier = taguer son repo public) ; un indexeur 100 % automatique (GitHub Action publique) valide mécaniquement les manifestes et publie un `index.json` statique que les Gladys consomment. Le mainteneur n'approuve rien et n'est jamais un goulot d'étranglement. Images Docker sur **n'importe quel registre public** ; **aucune modération en v1** (la sandbox Docker est la défense, assumé et documenté).
- **Canal retour core→intégration** : WebSocket sortant depuis l'intégration (pas de serveur HTTP dans le conteneur).
- **SDK v1** : API-hôte REST/WS documentée et ouverte à tous les langages ; SDK officiel + template en Node.js uniquement.
- **Pas de création de device par l'intégration** : elle publie des appareils découverts, l'utilisateur crée/modifie/supprime depuis l'interface (pattern des intégrations internes).
- **Modèle de données fusionné** : pas de table dédiée — une intégration externe **est** une ligne `t_service` (colonne `type`), pour éviter toute double identité à synchroniser.
- **Auth par JWT d'intégration stateless** : non lié à un user, hors `t_session` (réservée aux sessions utilisateur), régénéré à chaque recréation du conteneur.
- **Front au même niveau que les intégrations internes** : présence dans le catalogue d'intégrations avec un simple badge « externe », puis une page générique à 3 écrans — Appareils / Découverte / Configuration (formulaire défini en JSON par l'intégration). Un seul type d'intégration en v1 : « Appareils ».

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
- **Manifeste** : fichier **`gladys-assistant-integration.json` à la racine du repo GitHub** — c'est lui que le robot du store scrape (source de vérité pour l'index) — et dupliqué dans l'image Docker (LABEL `io.gladysassistant.manifest`, pour l'install « dev » par nom d'image sans repo). Contenu : nom, version, versions Gladys compatibles, **`config_schema`** (décrit le formulaire de l'écran Configuration, cf. B.8). Champ `manifest_version: 1` figé dès la v1. Pas de système de permissions en v1 (non applicable techniquement, cf. B.12).
- **Une intégration externe est un service** : ligne `t_service` avec `type: 'external'`, devices rattachés normalement, et un *proxy service* dans le stateManager (start/stop/setValue) qui l'insère dans le cycle de vie existant **sans modifier le core device ni le core service**.
- **Store décentralisé** : publier une intégration = créer un repo GitHub public avec le topic `gladys-assistant-integration` et un manifeste à la racine. Un indexeur automatique (repo `GladysAssistant/integration-store`, GitHub Action planifiée) crawle le topic, valide par script, publie un `index.json` statique sur GitHub Pages/CDN. Gladys télécharge et cache cet index → catalogue, installation en un clic, détection de mises à jour (détail en B.9).

### Phases livrables

| Phase | Contenu | Livrable observable |
|---|---|---|
| **1** | API-hôte + WS, superviseur, auth, API admin, **store décentralisé** (indexeur + catalogue + install 1 clic + mises à jour), front au niveau des intégrations internes : entrée dans le catalogue (badge « externe ») + page générique à 3 écrans Appareils / Découverte / Configuration (formulaire généré depuis le `config_schema`), SDK Node + template + PoC. Install « dev » par image Docker conservée. | N'importe quel dev tague son repo → son intégration apparaît dans le catalogue de toutes les Gladys sans aucune approbation → un utilisateur l'installe en un clic, ses appareils découverts sont créés depuis l'UI, actionnables, configurables via formulaire généré ; l'intégration survit à un kill (redémarrage auto), passe « En panne » avec logs après échecs répétés. |
| **2** | Découverte médiée (mDNS/USB par le core), widgets de config avancés, autres types d'intégrations que « Appareils » (communication, météo…). | Une intégration détecte son matériel sans config manuelle. |
| **3** | Écosystème : SDK/template extraits en repos dédiés, doc publique API-hôte, ranking/stats du store, durcissement supply-chain (épinglage par digest, signature d'images ?). | Écosystème auto-suffisant, sans intervention du mainteneur. |

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
| `store_slug` | STRING nullable | lien vers l'entrée d'index du store (`owner/repo`) pour la détection de mises à jour ; null en install dev |

Toutes nullables/défaut pour les services internes existants. **Dérivation du `selector`** (et du `name`) : préfixe `ext-` pour éviter toute collision avec un futur service natif (`service.load` cherche par `(pod_id: null, name)`), puis — install store ou `repo_url` : `ext-<owner>-<repo>` slugifié, **unique par construction** (c'est le `store_slug`) ; install dev par image : `ext-dev-<name du manifeste slugifié>`, suffixe numérique en cas de collision.

- **Statuts** : réutiliser `SERVICE_STATUS` existant en y ajoutant **une seule valeur : `DEGRADED`**. Projection de la machine à états RFC : Installée→`ENABLED`, Démarrage→`LOADING`, En fonctionnement→`RUNNING`, Dégradée→`DEGRADED`, En panne→`ERROR`, Arrêtée→`STOPPED`.
- **Logs : ni table, ni push.** L'intégration écrit sur stdout/stderr ; Gladys consulte les logs à la demande via l'API Docker (`system.getContainerLogs(container_id)` existant, équivalent `docker logs`).
- **Constantes** (`server/utils/constants.js`) : `SERVICE_STATUS.DEGRADED`, `SERVICE_TYPES`, `EVENTS.EXTERNAL_INTEGRATION.*`, `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.*` (front : `STATUS_CHANGED`, `DISCOVERED_DEVICES_UPDATED` ; intégration : `DEVICE_SET_VALUE`, `DEVICE_POLL`, `COMMAND_RESULT`, `SCAN_REQUEST`, `DEVICE_CREATED`, `DEVICE_UPDATED`, `DEVICE_DELETED`, `HEARTBEAT`, `CONFIG_UPDATED`), `AUTHENTICATION.INTEGRATION_REQUEST`.
- **Appareils découverts : pas de table.** La liste des appareils découverts publiée par chaque intégration est tenue **en mémoire** dans le superviseur (comme le font les handlers des services internes, ex. philips-hue), perdue au redémarrage et republiée par l'intégration à sa connexion.

### B.2 Superviseur — `server/lib/external-integration/`

Pattern prototype « une fonction par fichier » (comme `server/lib/system/`). Injecté dans `server/lib/index.js` (avec le `jwtSecret`, comme `Session`) ; `init()` appelé **avant** `service.startAll()` : il enregistre les proxy-services dans le stateManager, et `startAll` démarre alors intégrations internes et externes par le même chemin (+ flag `disableExternalIntegration` pour les tests).

Fichiers principaux : `index.js` (constructeur : maps connexions WS, commandes en attente, timers), `externalIntegration.init.js` (charge les `t_service` de type `external`, **réconcilie** les conteneurs par label — cas restore de backup —, enregistre les proxy-services), `install.js` (résolution du manifeste — depuis l'index du store, ou via les labels de l'image en mode dev — → pull → validation → création ligne `t_service` type `external` → génération du JWT (B.3) → conteneur → start), `buildContainerDescriptor.js`, `start/stop/restart/uninstall.js` (start/stop appelés aussi via le proxy-service par le cycle de vie standard ; **uninstall supprime tout** : stop + suppression du conteneur, des devices, des variables de config, puis destroy `t_service` — pas d'option « conserver les devices », `t_device.service_id` est une FK obligatoire et des devices orphelins n'existent pas dans le modèle ; l'utilisateur retrouve tout via la Découverte s'il réinstalle), `saveStatus.js` (update `t_service.status` + `EVENTS.WEBSOCKET.SEND_ALL`), `checkHealth.js` (toutes les 30 s), `scheduleRestart.js` (backoff `min(10s·2^n, 15min)`), `integrationConnected/Disconnected.js`, `sendCommand.js` (message_id + ack, **timeout 5 s**), `registerProxyService.js`, `getLogs.js` (simple délégation à `system.getContainerLogs(container_id)`).

**Transitions de la machine à états (règles exactes)** :
- `LOADING` : au démarrage du conteneur (start/restart/install/update).
- `LOADING → RUNNING` : à la **première auth WS réussie ou premier heartbeat HTTP** — un conteneur démarré n'est pas une intégration fonctionnelle. Ni l'un ni l'autre sous **60 s** après le start → `DEGRADED`.
- `RUNNING → DEGRADED` : 2 pongs WS manqués, ou WS fermé, ou heartbeat > 60 s (`checkHealth`).
- `DEGRADED → RUNNING` : sur reconnexion WS ou réception d'un heartbeat.
- Conteneur exité (constaté par `checkHealth`) → restart avec backoff ; `failure_count` incrémenté à chaque restart superviseur, **remis à zéro après 60 s de `RUNNING` stable** (sans reset, 5 crashs répartis sur six mois mettraient l'intégration en panne) ; `failure_count ≥ 5` → `ERROR` (plus de restart auto, action admin requise).
- `STOPPED` : uniquement par action utilisateur (stop) ; ignoré au boot par `startAll`.

**Conteneur verrouillé** : rootfs read-only, zéro capability, pas d'escalade, 256 Mo / 0,5 CPU / 100 pids, un seul bind `/data` (via `system.getGladysBasePath()`), tmpfs `/tmp` noexec, bridge dédié, restart géré par le superviseur (pas par Docker), label de réconciliation, logs bornés. **Descripteur `createContainer` complet, justification champ par champ et contrat des variables d'environnement (`GLADYS_HOST_API_URL`, `GLADYS_INTEGRATION_TOKEN`, `GLADYS_INTEGRATION_SELECTOR`, `TZ`) : spécifiés en C.7.**

**Ajouts à `server/lib/system/`** : `system.createNetwork.js` (bridge `gladys-integrations`, `enable_icc=false` pour isoler les intégrations entre elles, **subnet épinglé par IPAM** : `172.30.0.0/24`, gateway `172.30.0.1` — cf. C.7), `system.inspectNetwork.js` (lecture de la gateway effective pour `GLADYS_HOST_API_URL`), `system.getImageLabels.js` (lecture du manifeste).

**Réseau : compatible avec le Gladys de production en `--network=host`, sans toucher au `docker run` existant.**
- Le bridge est créé **à chaud** au premier démarrage du superviseur (`dockerode.createNetwork`, idempotent via `listNetworks`) — créer un réseau Docker a posteriori ne demande aucun redémarrage.
- Un conteneur en `--network=host` **ne peut pas** rejoindre un autre réseau (refus Docker) — mais il n'en a pas besoin : Gladys en host écoute sur toutes les interfaces de l'hôte, y compris celle du bridge (`br-xxxx`). Depuis un conteneur d'intégration, la **gateway du bridge** est l'hôte → `GLADYS_HOST_API_URL = http://<gateway>:<SERVER_PORT>`. Le subnet étant épinglé à la création du réseau (`172.30.0.0/24`), la gateway est **déterministe : `172.30.0.1`** sur la quasi-totalité des installs ; si ce subnet est déjà occupé sur la machine (rare), repli sur l'auto-assignation Docker, et la gateway effective est lue via `inspectNetwork` (`IPAM.Config[0].Gateway`). Pas de NAT, pas de port à publier.
- Cas Gladys en **bridge** (installs non standard) : l'attachement a posteriori fonctionne, lui (`network.connect(getGladysContainerId())`, à chaud), et les intégrations joignent Gladys par le DNS embarqué du bridge custom. Distinction des deux cas via le `getNetworkMode()` existant. Design plus permissif que les services actuels (node-red/z2m/matterbridge exigent le mode host).
- `enable_icc=false` ne bloque que le trafic conteneur↔conteneur sur le bridge (l'isolation voulue entre intégrations) ; conteneur→gateway (Gladys) et conteneur→internet (NAT) passent normalement. À documenter : un pare-feu host strict (ufw) filtre le trafic bridge→hôte (chaîne INPUT).

### B.3 Auth des intégrations : JWT stateless, hors `t_session`

`t_session` reste réservée aux sessions **utilisateur** (elle sert à voir les connexions depuis un navigateur inconnu) — une intégration n'est liée à aucun user, on ne mélange pas les deux notions.

- **Un JWT d'intégration par conteneur** : signé HS256 avec le `jwtSecret` existant (même mécanique que `server/utils/accessToken.js`, nouveau fichier `server/utils/integrationToken.js`), payload `{ service_id, token_version }`, `issuer: 'gladys'`, **`audience: 'integration'`** (un access token utilisateur ne peut donc jamais passer pour un token d'intégration, et inversement), **sans expiration** (pas de claim `exp`) : la révocation par `token_version` est le seul mécanisme de fin de vie — une expiration ajouterait un mode de panne (« l'intégration meurt au bout de N mois ») sans bénéfice de sécurité.
- **Rotation/révocation via `t_service.token_version`** : le token embarque la version courante ; le middleware compare avec la colonne. À chaque **recréation du conteneur**, on incrémente `token_version` et on injecte un nouveau JWT en Env → tous les anciens tokens sont immédiatement invalides, sans stocker aucun token nulle part (rien à hasher, rien à révoquer ligne par ligne). Coût : zéro requête supplémentaire, le middleware doit de toute façon charger la ligne `t_service` pour construire le contexte tenant. Désinstallation = destroy de la ligne → le token meurt avec.
- Nouveau middleware `server/api/middlewares/externalIntegrationAuthMiddleware.js` : vérifie signature + audience + `type: 'external'` + `token_version`, charge la ligne → `req.externalIntegrationService` ; nouveau flag `externalIntegrationAuth: true` géré dans `server/api/setupRoutes.js` (même mécanique que `alarmAuth`/`resetPasswordAuth`).
- **Isolation tenant (règle absolue)** : `service_id` du JWT fait foi, `external_id` forcé au préfixe `ext:<selector>:`, ownership vérifié à chaque lecture, variables via `gladys.variable.*(key, service_id)`.
- Le token est injecté en Env, jamais réaffiché ; action admin « régénérer le token » = incrémenter `token_version` + recréer le conteneur.

### B.4 API-hôte REST — `/api/integration/v1/`

Préfixe hors `/api/v1/` utilisateur, versionné par URL. Contrôleur `server/api/controllers/integrationHost.controller.js`, routes dans `server/api/routes.js`. **Contrats détaillés (corps de requêtes/réponses) en C.2–C.3.**

**L'API-hôte ne permet ni création ni suppression de device.** L'intégration publie ses appareils découverts ; la création/modification/suppression reste un geste utilisateur dans l'UI (via le `POST /api/v1/device` standard, comme pour les intégrations internes).

| Endpoint | Mapping |
|---|---|
| `POST /discovered_device` (batch, remplace la liste) | stocké en mémoire par le superviseur (`external_id` préfixés `ext:<selector>:` forcés) ; push front `DISCOVERED_DEVICES_UPDATED` ; le superviseur marque ceux déjà créés en DB (match `external_id`) |
| `GET /device` | **lecture seule** : les devices de l'intégration réellement créés par l'utilisateur (`service_id` forcé) — permet à l'intégration de savoir quoi piloter/poller au démarrage |
| `POST /state` (batch) | `EVENTS.DEVICE.NEW_STATE` (chemin des services natifs) ; rate-limit 300 états/min (cf. C.3) |
| `GET/POST /config` | `gladys.variable.getValue/setValue(key, service_id)` (config + secrets en DB core) |
| `POST /heartbeat`, `GET /status` | fallback HTTP + statut au boot du SDK |

**Pas d'endpoint de logs** : l'intégration ne pousse pas ses logs, elle écrit simplement sur stdout/stderr et Gladys les consulte via l'API Docker (`system.getContainerLogs(container_id)` existant, équivalent `docker logs`). Beaucoup plus simple, et ça marche dans tous les langages sans SDK.

Ne **pas** exposer ces routes via le gateway Gladys Plus (`setupGateway`).

### B.5 WebSocket intégrations

Étendre `server/api/websockets/index.js` (même WSS, nouveau `case` dans le switch) : message `AUTHENTICATION.INTEGRATION_REQUEST { token }` → validation du JWT d'intégration (signature + audience + `token_version`, cf. B.3) → `gladys.externalIntegration.integrationConnected(service, ws)`. Heartbeat : `ws.ping()` toutes les 20 s + flag `isAlive` sur `pong` + message applicatif `HEARTBEAT` (maj `last_heartbeat`) ; 2 pings manqués → DEGRADED. Reconnexion gérée par le SDK (backoff), une reconnexion remplace l'ancienne entrée.

**Protocole complet (types et payloads) spécifié en C.4.** Messages descendants (core→intégration) :
- des **commandes spécifiques** (un type par action, pas de type générique) : `DEVICE_SET_VALUE`, `DEVICE_POLL` — chacune porte un `message_id` et attend un ack `COMMAND_RESULT` (voir B.6) ;
- `SCAN_REQUEST` : demande de (re)découverte déclenchée depuis l'onglet Découverte de l'UI — l'intégration répond en republiant via `POST /discovered_device` ;
- `DEVICE_CREATED` / `DEVICE_UPDATED` / `DEVICE_DELETED { device }` : relayés par les hooks `postCreate`/`postUpdate`/`postDelete` du proxy-service — le core les appelle déjà sur le service propriétaire à chaque geste utilisateur (vérifié : `server/lib/device/device.notify.js`). L'intégration sait ainsi immédiatement quels appareils suivre ou abandonner, sans polling.

### B.6 Routing des commandes

Aucune modification de `device.setValue.js` ni de `device.notify.js` : `registerProxyService.js` pose dans le stateManager, sous le nom du `t_service` de l'intégration, un objet gelé `{ device: { setValue, poll, postCreate, postUpdate, postDelete } }` — `setValue` envoie `DEVICE_SET_VALUE`, `poll` envoie `DEVICE_POLL` (appelé par le scheduler core pour les devices à `poll_frequency`, comme pour les services internes), les trois hooks relaient les notifications de cycle de vie (B.5). `sendCommand(type, payload)` → WS + ack (timeout 5 s → throw, ex. nouvelle `ExternalIntegrationUnavailableError` dans `utils/coreErrors.js`) ; intégration déconnectée → throw immédiat. Retour d'état réel via `POST /state` (documenter `has_feedback: true` pour les features actionnables).

### B.7 API de gestion (admin)

`server/api/controllers/externalIntegration.controller.js`, opérant sur les lignes `t_service` de type `external` (pas de nouvelle table). **Contrats détaillés en C.5.**

- **Admin** : `POST /api/v1/external_integration` avec **trois modes d'installation** — `{ store_slug }` (depuis le store, le serveur résout image + manifeste depuis son cache d'index), `{ repo_url }` (**depuis une URL de repo GitHub**, indexé ou non : le serveur résout la branche par défaut via l'API GitHub, télécharge `gladys-assistant-integration.json` en raw, le valide avec le même JSON Schema que l'indexeur, puis suit le chemin d'install standard ; `store_slug` est déduit = `owner/repo`), `{ docker_image, manifest }` (mode dev sans repo). Puis `POST .../:selector/update` (pull + recréation du conteneur), `POST .../start|stop|restart`, `GET .../logs`, `DELETE` (supprime **tout** : conteneur, devices, config — cf. B.2).
- **Utilisateur standard** : `GET /api/v1/external_integration` (liste + statut, alimente le catalogue d'intégrations du front, cf. B.8), `GET .../:selector` (détail : manifeste, `config_schema`, statut) et `GET /api/v1/external_integration/store` (catalogue du store depuis le cache d'index serveur, filtré par compatibilité de version Gladys, avec recherche + flags « installée » / « mise à jour disponible » ; `POST .../store/refresh` pour re-télécharger l'index à la demande).
- **Écran Découverte** : `GET /api/v1/external_integration/:selector/discovered_device` (liste mémoire du superviseur, avec le flag « déjà créé ») et `POST .../scan` (envoie `SCAN_REQUEST` à l'intégration). La création du device se fait ensuite par le `POST /api/v1/device` existant, comme pour les intégrations internes.
- **Écran Configuration** : `GET/POST /api/v1/external_integration/:selector/config` — valide le payload contre le `config_schema` du manifeste (format plat spécifié en C.1), persiste via `gladys.variable.setValue(key, service_id)` (les champs `secret: true` ne sont jamais renvoyés en clair par le `GET`), puis pousse `CONFIG_UPDATED` à l'intégration par WS pour qu'elle recharge sa config sans redémarrage.

### B.8 Front : au même niveau que les intégrations internes

Pas de page « à part » dans les Paramètres : une intégration externe se présente et s'utilise **exactement comme une intégration interne**, avec juste un badge « externe ». Un seul type géré en phase 1 : les intégrations de type **« Appareils »** (catégorie `device` du catalogue).

**Dans le catalogue d'intégrations** (`front/src/routes/integration/index.js`) : aujourd'hui la liste vient de JSON statiques (`front/src/config/integrations/devices.json`). On y fusionne les intégrations externes du **store** (`GET /api/v1/external_integration/store`, cf. B.9) — mêmes cartes (nom, cover re-hébergée par l'indexeur — `cover_url` — ou placeholder), plus un **badge « externe »**, et pour celles installées le badge de statut temps réel (`STATUS_CHANGED`) et le flag « mise à jour disponible ». La liste affichée est l'**union** de `GET /api/v1/external_integration` (installées — y compris celles hors index : install par `repo_url` pas encore crawlée, mode dev) et de `GET .../store` (index), **dédupliquée par `store_slug`** : une intégration installée n'apparaît qu'une fois, avec son statut. Cliquer sur une intégration non installée ouvre un écran d'installation : description, avertissement clair (code tiers non audité, accès réseau sortant complet), bouton « Installer » (un clic).

**Installer hors store — parcours grand public, pas un « mode dev » caché.** Une **carte dédiée en fin de catalogue** (catégorie Appareils), « Installer depuis GitHub », ouvre une modal où l'utilisateur colle simplement l'**URL d'un repo GitHub** ; Gladys récupère et valide le manifeste du repo, affiche le même écran d'installation (nom, description, avertissement) et installe (`POST` avec `repo_url`, cf. C.5). C'est le chaînon entre le store et le partage direct : beta-test d'une intégration, repo pas encore crawlé par l'indexeur, intégration confidentielle. Dans la même modal, un lien discret « Mode développeur » révèle le formulaire avancé image Docker + manifeste inline (pour travailler sans repo). Note : comme toute installation, l'action reste réservée au rôle admin — la catégorie Appareils du catalogue est de toute façon masquée aux non-admins dans le front actuel — mais l'UX est pensée pour un utilisateur non technique : coller une URL, cliquer Installer.

**Une page générique unique** `front/src/routes/integration/all/external-integration/` sert toutes les intégrations externes, sur le modèle exact des pages internes (sidebar `Zigbee2mqttPage`-like, routes dynamiques dans `front/src/components/app.jsx`), avec les 3 écrans :

| Écran | Route | Contenu |
|---|---|---|
| **Appareils** | `/dashboard/integration/device/external/:selector` | Les appareils déjà créés de l'intégration (mêmes cartes/édition que les device-pages internes, filtrées par le `t_service` de l'intégration) |
| **Découverte** | `.../discover` | Appareils découverts (nom, features, badge « déjà créé »), bouton « Scanner » (`POST .../scan`), bouton « Créer » par appareil (`POST /api/v1/device` standard), temps réel via `DISCOVERED_DEVICES_UPDATED` |
| **Configuration** | `.../config` | **Formulaire généré depuis le `config_schema` JSON du manifeste** (UI déclarative de la RFC : champs texte/nombre/booléen/select/secret en v1, aucun code injecté), sauvegarde via `POST .../config`. S'y ajoutent le bloc de supervision : statut, actions start/stop/restart, modal logs, désinstaller (admin) |

Modèles de code : `front/src/routes/integration/all/zigbee2mqtt/` (structure 3 onglets device/discover/setup) et `front/src/routes/integration/all/mcp/` (appels API). i18n dans **toutes** les langues (`front/src/config/i18n/*.json`, check `compare-translations`) — les libellés des champs de config viennent du manifeste (avec clés multi-langues optionnelles), pas des fichiers i18n de Gladys.

### B.9 Le store : index décentralisé auto-généré

**Principe : publier ne demande la permission de personne.** La source de vérité est distribuée sur GitHub ; l'index n'est qu'un cache public reconstruit par un robot.

**Côté développeur d'intégration** — publier =
1. repo GitHub **public** avec le topic **`gladys-assistant-integration`** ;
2. un fichier **`gladys-assistant-integration.json`** à la racine (le manifeste : `manifest_version`, `slug` implicite = `owner/repo`, nom, description multi-langue, `version`, `docker_image` — n'importe quel registre public, tag ou digest —, versions Gladys compatibles, `config_schema`, URL d'image de couverture) ;
3. publier une nouvelle version = bumper `version` + `docker_image` dans le manifeste et pousser. C'est tout — pas de compte à créer, pas de PR à faire approuver.

Le même manifeste est dupliqué dans l'image Docker (LABEL `io.gladysassistant.manifest`, le template le fait automatiquement au build) : le fichier du **repo** fait foi pour le store (c'est lui que le robot scrape) ; le **LABEL** ne sert qu'à l'install « dev » par nom d'image, sans repo GitHub. À l'installation depuis le store, c'est la version de l'index qui est enregistrée dans `t_service.manifest`.

**L'indexeur** — nouveau repo public `GladysAssistant/integration-store` (hors monorepo) :
- GitHub Action **planifiée toutes les heures** (+ déclenchable manuellement) : recherche GitHub par topic → fetch du `gladys-assistant-integration.json` de chaque repo (raw.githubusercontent) → **validation par script uniquement** (JSON Schema du manifeste, référence d'image bien formée, `manifest_version` supporté, cover téléchargée/validée/re-hébergée cf. C.1) → construction de `index.json` enrichi des métadonnées GitHub (stars, date de dernier commit — ranking gratuit sans télémétrie centralisée) → publication sur **GitHub Pages** (statique, CDN). Formats `index.json`/`rejected.json` spécifiés en C.6.
- Les manifestes invalides sont listés dans un `rejected.json` public avec la raison → un dev diagnostique seul pourquoi son intégration n'apparaît pas, sans ouvrir de ticket.
- Le code de validation est public : les règles d'admission sont vérifiables par tous, et n'importe qui peut re-générer l'index (fork de l'Action) — le store lui-même est forkable, donc pas de point de contrôle.
- **Aucune modération en v1** (choix assumé) : pas de blocklist, pas de retrait manuel. La défense, c'est la sandbox (B.2) + l'avertissement à l'installation. Une blocklist resterait ajoutable plus tard côté indexeur sans toucher au client.

**Côté Gladys** — sous-dossier `store/` du superviseur (`store.getIndex.js`, `store.refreshIndex.js`, `store.checkForUpdates.js`) :
- télécharge `index.json` (URL par défaut surchargeable par variable — utile pour les tests et pour pointer un index alternatif), **cache local persistant** (fichier ou `t_variable`) rafraîchi toutes les 12 h : le catalogue reste consultable hors ligne ou si GitHub Pages est indisponible, et les intégrations installées ne dépendent jamais de l'index pour fonctionner ;
- filtre par compatibilité de version Gladys avant d'exposer au front ;
- compare `index.version` vs `t_service.version` (lien par `store_slug`) → flag « mise à jour disponible », l'update est un geste admin explicite (pas d'auto-update en v1) ;
- pour les intégrations installées par `repo_url` (cf. C.5) absentes de l'index, le refresh re-télécharge directement le manifeste de leur repo — même mécanique de détection de mise à jour, sans dépendre du crawl.

**Résilience, en résumé** : GitHub Pages statique en façade (pas de rate limit, CDN), cache local en second rideau, runtime totalement découplé du store en dernier ressort. Le pire scénario (GitHub entièrement down) suspend la découverte de nouvelles intégrations, jamais le fonctionnement de l'existant.

### B.10 SDK Node.js + PoC

- Dossier racine `integration-sdk/` du monorepo en phase 1 (`node/` = futur paquet npm `@gladysassistant/integration-sdk`, `examples/demo/` = PoC) ; extraction en repos dédiés en phase 3, dont un **template de repo publiable** (`gladys-assistant-integration.json` pré-rempli, Dockerfile, workflow GitHub de build/push d'image **multi-arch `linux/amd64` + `linux/arm64` via buildx** — cf. B.12.7 : créer le repo depuis le template + le taguer suffit à être dans le store, Raspberry Pi inclus). Package.json propre, hors lint/coverage serveur.
- SDK : classe `GladysIntegration` — lit les env vars, client REST (fetch), WS avec auth + reconnexion + pings, helpers `publishDiscoveredDevices(devices)`, `getDevices()` (devices créés par l'utilisateur), `publishState`, `onSetValue` + `onPoll` (ack auto), `onScanRequest`, `onDeviceCreated/Updated/Deleted`, `getConfig` + `onConfigUpdated` (rechargement à chaud quand l'utilisateur sauvegarde l'écran Configuration). Pas de helper de logs : l'intégration loggue sur stdout/stderr, récupérés par `docker logs`.
- **PoC `gladys-integration-demo`** (testable sans matériel, couvre tout le cycle y compris les 3 écrans) : publie deux appareils découverts — un capteur température Open-Meteo (API publique sans clé) et un interrupteur virtuel. L'utilisateur les crée depuis l'écran Découverte ; l'intégration publie alors la température toutes les 10 min et répond aux commandes de l'interrupteur (reçoit `onSetValue`, republie l'état). Son manifeste embarque un `config_schema` (latitude/longitude + intervalle de rafraîchissement) pour exercer le formulaire généré de l'écran Configuration et `onConfigUpdated`. Dockerfile `node:22-alpine`, `USER node`, compatible rootfs read-only. Manifeste dans le LABEL.

### B.11 Tests (patch coverage 100 % exigé en CI)

- Superviseur : `server/test/lib/external-integration/` (un fichier par fonction), Docker mocké via `server/test/lib/system/DockerodeMock.test.js` à étendre (createNetwork, getImage().inspect avec Labels) ou fakes sinon de `gladys.system.*`.
- Contrôleurs : supertest ; API-hôte appelée avec un JWT d'intégration généré en seed (pas `authenticatedRequest`, qui est un token utilisateur). **Tests d'isolation tenant obligatoires** (token de A ≠ devices de B, préfixe `external_id` rejeté, access token utilisateur refusé sur l'API-hôte — mauvaise audience).
- Middleware : 401 (token absent/signature invalide/mauvaise audience/`token_version` obsolète/service non externe). WS : auth OK/KO, commande + ack + timeout (étendre `server/test/websockets/`).
- Store côté serveur : fetch d'index mocké (nock ou fake), cache local (hit/miss/expiration/index indisponible), filtre de compatibilité de version, détection de mise à jour, install par `store_slug` inconnu → 404, install par `repo_url` (fetch GitHub mocké : succès, repo introuvable → 404, manifeste absent/invalide → 422), et test anti-collision de routes (`GET .../store` renvoie le catalogue, pas le handler `:selector`, cf. C.5).
- Indexeur (repo `integration-store`, CI propre hors monorepo) : validation de manifestes valides/invalides (dont bornes name/description), validation de covers (format/dimensions/poids, warning + placeholder si KO), génération `index.json`/`rejected.json` déterministe sur fixtures.
- SDK/PoC : suite Mocha propre dans `integration-sdk/node`, hors CI serveur.

### B.12 Risques assumés (v1)

1. **Egress réseau totalement ouvert** (choix v1) : Docker ne filtre pas par hôte de destination, et on ne prétend pas le faire — **pas de champ `permissions` dans le manifeste** : une déclaration non appliquée techniquement serait de la fausse sécurité. L'écran d'installation dit clairement que l'intégration a un accès réseau sortant complet. Le bridge dédié + `enable_icc=false` isolent uniquement les intégrations **entre elles**. Piste phase 3 : proxy sidecar ou nftables — et réintroduction d'un champ de permissions le jour où il sera réellement appliqué.
2. **Sans socket Docker** (dev, installs exotiques) : `PlatformNotCompatible` déjà levée par `system.*` → superviseur no-op + « non disponible » dans l'UI + mode dev SDK hors Docker documenté (endpoint admin pour générer un JWT d'intégration de dev).
3. **Secrets en Env** : le JWT est visible via `docker inspect` (qui suppose déjà l'accès à la socket = root de fait). Acceptable v1 : token scoppé à une seule intégration et invalidable instantanément via `token_version`.
4. **Backup/restore** : `container_id` obsolète après restore → réconciliation par label au boot ; `/data` du conteneur hors backup DB (documenter : persister l'important via `/config`).
5. **Aucune modération du store** (choix v1) : un malware avéré reste listé tant que son auteur ne retire pas le topic. Défenses réelles : sandbox stricte (B.2), avertissement affiché avant install, métadonnées GitHub visibles (stars, âge du repo). Une blocklist côté indexeur reste ajoutable plus tard sans toucher au client.
6. **Supply-chain images** (registre libre + tags mutables) : un manifeste peut référencer l'image de n'importe qui, et un tag peut être réécrit après indexation. V1 : assumé et documenté (le template recommande GHCR du même repo et l'épinglage par digest, sans l'imposer) ; durcissement (digest obligatoire, signature) en phase 3.
7. **Architectures CPU** : une grande partie du parc Gladys tourne sur Raspberry Pi (arm64) — une image amd64-only y échoue au pull ou au run. V1 : le **template builde multi-arch par défaut** (`docker buildx`, `linux/amd64` + `linux/arm64`, le workflow fourni le fait sans config) ; côté Gladys, un échec de pull/run pour architecture incompatible → statut `ERROR` avec **message explicite** dans l'UI (« image non disponible pour votre architecture »), pas une erreur Docker brute. Piste indexeur : vérifier les plateformes du manifest list de l'image et les afficher dans le catalogue.

## C. Spécification des interfaces (contrats v1)

Conventions générales, alignées sur l'existant :
- **REST** : JSON exclusivement ; erreurs au format standard Gladys `{ "status": <code HTTP>, "code": "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "UNPROCESSABLE_ENTITY" | ..., "message": "..." }` (produit par `errorMiddleware`).
- **WebSocket** : enveloppe existante `{ "type": "<namespace.kebab-case>", "payload": { ... } }` (`formatWebsocketMessage`).
- **Dates** : ISO 8601 UTC. **Identifiants externes** : tout `external_id` d'une intégration est préfixé `ext:<selector>:` (le serveur rejette le reste).

### C.1 Le manifeste `gladys-assistant-integration.json`

Exemple complet (celui du PoC) :

```json
{
  "manifest_version": 1,
  "type": "device",
  "name": "Open-Meteo Demo",
  "description": {
    "en": "Weather sensor and virtual switch demo integration.",
    "fr": "Intégration démo : capteur météo et interrupteur virtuel."
  },
  "version": "1.2.0",
  "docker_image": "ghcr.io/john/gladys-open-meteo-demo:1.2.0",
  "gladys_version": ">=4.62.0",
  "cover_image": "https://raw.githubusercontent.com/john/gladys-open-meteo-demo/main/cover.jpg",
  "config_schema": [
    {
      "key": "latitude",
      "type": "number",
      "label": { "en": "Latitude", "fr": "Latitude" },
      "required": true,
      "default": 48.85,
      "min": -90,
      "max": 90
    },
    {
      "key": "api_key",
      "type": "secret",
      "label": { "en": "API key", "fr": "Clé d'API" },
      "required": false
    },
    {
      "key": "unit",
      "type": "select",
      "label": { "en": "Unit", "fr": "Unité" },
      "default": "celsius",
      "options": [
        { "value": "celsius", "label": { "en": "Celsius", "fr": "Celsius" } },
        { "value": "fahrenheit", "label": { "en": "Fahrenheit", "fr": "Fahrenheit" } }
      ]
    }
  ]
}
```

| Champ | Type | Obligatoire | Règles de validation (indexeur **et** serveur) |
|---|---|---|---|
| `manifest_version` | integer | oui | `1` ; rejet si supérieur à la version supportée |
| `type` | string | oui | `"device"` (seule valeur en v1) |
| `name` | string | oui | 3–30 caractères (affiché comme titre de la carte du catalogue ; les intégrations internes font 3–23) |
| `description` | objet `{lang: string}` | oui | clé `en` obligatoire, autres langues optionnelles ; chaque valeur **10–100 caractères** (affichée sur la carte ; les descriptions internes font 23–63, une phrase courte) |
| `version` | string | oui | semver strict ; doit être bumpé pour déclencher « mise à jour disponible » |
| `docker_image` | string | oui | référence d'image valide, registre public, tag **ou digest** |
| `gladys_version` | string | oui | range semver (syntaxe npm) ; sert au filtre de compatibilité |
| `cover_image` | string | non | URL `https` d'une image **JPEG ou PNG**, **800×534 px exactement** (le format unique des covers internes, ratio 3:2), **≤ 150 Ko** (les covers internes font 13–85 Ko). Validée puis **re-hébergée par l'indexeur** (voir ci-dessous) |
| `config_schema` | array | non | liste **plate** de champs (voir ci-dessous) |

Pas de champ `permissions` en v1 : l'accès réseau sortant est ouvert et l'écran d'installation le dit — on ne spécifie pas ce qu'on ne sait pas appliquer (cf. B.12). Le champ pourra apparaître dans une future `manifest_version` quand une restriction réelle existera.

**Cover re-hébergée par l'indexeur** : à chaque crawl, l'indexeur télécharge la `cover_image`, la valide (magic bytes JPEG/PNG, 800×534, ≤ 150 Ko) et publie une copie sur GitHub Pages ; c'est **cette URL-là** que l'index référence (`cover_url`, cf. C.6). Trois bénéfices : pas de lien mort dans le catalogue, pas de fuite d'IP des utilisateurs vers un serveur tiers à chaque affichage du catalogue, et poids/format garantis. Une cover absente ou invalide ne rejette pas l'intégration : elle est indexée avec un placeholder, et un avertissement (`level: "warning"`) est publié dans `rejected.json`.

**Fallback de langue** (tous les champs multi-langues : `description` du manifeste, `label`/`description`/`options[].label` du `config_schema`) : le front affiche la langue de l'utilisateur si présente, sinon `en` (obligatoire partout, donc toujours disponible).

**`config_schema`** : volontairement une liste plate de champs, pas du JSON Schema complet — le rendu du formulaire reste déterministe et sans surprise (principe « UI déclarative »). Champs par entrée : `key` (unique, `[a-z0-9_]`), `type` (`string` | `number` | `boolean` | `select` | `secret`), `label` (multi-langue, `en` obligatoire), `description` (multi-langue, optionnel), `required` (défaut `false`), `default`, `min`/`max` (number), `options` (select : `[{ value, label }]`). Les valeurs sont stockées dans `t_variable` scoppées par `service_id` ; les `secret` ne sont **jamais renvoyés au front** (cf. C.5), mais sont fournis à l'intégration.

### C.2 API-hôte : conventions d'accès

- Base : `GLADYS_HOST_API_URL` (env injectée, ex. `http://172.18.0.1:80`) + préfixe **`/api/integration/v1`**.
- Auth : header **`Authorization: Bearer <GLADYS_INTEGRATION_TOKEN>`** (JWT injecté en env, cf. B.3). Absent/invalide/mauvaise audience/`token_version` obsolète → `401 UNAUTHORIZED`.
- **Pas de selector d'intégration dans les URLs** : l'identité vient du JWT (`service_id` dans le payload), chaque intégration ne voit que son propre périmètre. Mettre le selector dans l'URL serait redondant — le serveur devrait de toute façon vérifier qu'il correspond au token — et créerait une surface d'erreur inutile (mismatch URL/token). C'est le pattern « l'API parle à *l'intégration authentifiée* », comme un `/me`.

### C.3 API-hôte : endpoints

**`GET /api/integration/v1/status`** → `200`
```json
{ "gladys_version": "4.62.0", "service": { "id": "uuid", "selector": "ext-open-meteo-demo", "status": "RUNNING", "version": "1.2.0" } }
```

**`POST /api/integration/v1/heartbeat`** — corps `{}` → `200 { "success": true }` (fallback HTTP du heartbeat WS).

**`POST /api/integration/v1/discovered_device`** — publie la liste **complète** des appareils découverts (remplace la précédente). Objet device = format standard Gladys, sans `service_id` ni `selector` (forcés côté serveur) :
```json
{
  "devices": [
    {
      "name": "Météo Paris",
      "external_id": "ext:open-meteo-demo:paris",
      "features": [
        {
          "name": "Température",
          "external_id": "ext:open-meteo-demo:paris:temperature",
          "category": "temperature-sensor",
          "type": "decimal",
          "unit": "celsius",
          "min": -50,
          "max": 60,
          "read_only": true,
          "has_feedback": false,
          "keep_history": true
        }
      ],
      "params": [{ "name": "CITY", "value": "paris" }]
    }
  ]
}
```
→ `200 { "success": true, "count": 1 }`. Règles : `external_id` préfixés (device **et** features), `category`/`type`/`unit` dans les listes standard de Gladys (`DEVICE_FEATURE_CATEGORIES`/`TYPES`/`UNITS`), max 200 devices, `400` sinon. Champ optionnel **`poll_frequency`** au niveau du device (valeurs de `DEVICE_POLL_FREQUENCIES` existant : 1 s à 60 s) pour recevoir des `device.poll` du scheduler core une fois le device créé.

**`GET /api/integration/v1/device`** → `200 [ <device> ]` — les devices de l'intégration **réellement créés par l'utilisateur** (format standard complet : `id`, `selector`, `features` avec leurs `selector`/`last_value`, `params`).

**`POST /api/integration/v1/state`** — batch d'états, mappé sur `EVENTS.DEVICE.NEW_STATE` (mêmes champs que `device.newStateEvent`) :
```json
{
  "states": [
    { "device_feature_external_id": "ext:open-meteo-demo:paris:temperature", "state": 21.5 },
    { "device_feature_external_id": "ext:open-meteo-demo:cam:text", "text": "hello" },
    { "device_feature_external_id": "ext:open-meteo-demo:paris:temperature", "state": 19.2, "created_at": "2026-07-12T10:00:00.000Z" }
  ]
}
```
→ `200 { "success": true }`. `state` numérique **ou** `text` string ; `created_at` optionnel pour un état passé. Max 100 états/requête ; **rate-limit : 300 états/minute par intégration**, `429 TOO_MANY_REQUESTS` au-delà (anti-spam SQLite/DuckDB). Un `device_feature_external_id` inconnu est ignoré silencieusement (comportement standard de `newStateEvent` : l'utilisateur n'a pas créé ce device).

**`GET /api/integration/v1/config`** → `200 { "config": { "latitude": 48.85, "unit": "celsius", "api_key": "s3cr3t" } }` — toutes les valeurs, secrets inclus (c'est l'intégration, pas le front).

**`POST /api/integration/v1/config`** — corps `{ "config": { "<key>": <value> } }`, merge partiel → `200 { "success": true }`. Les clés présentes dans le `config_schema` sont validées contre lui ; les clés hors schéma sont un **stockage interne libre** de l'intégration (état d'appairage, tokens tiers…), jamais affichées dans l'UI.

### C.4 WebSocket intégration : protocole

Connexion : même hôte/port que l'API-hôte (`ws://<gateway>:<port>/`, même serveur HTTP). Non authentifié après 5 s → connexion terminée (comportement existant).

| Sens | `type` | `payload` |
|---|---|---|
| intégration → core | `authenticate.integration-request` | `{ "token": "<JWT>" }` — **premier message obligatoire** |
| core → intégration | `authentication.connected` | `{}` (réutilisé tel quel ; échec = close code `4000` `INVALID_ACCESS_TOKEN`) |
| core → intégration | `external-integration.device.set-value` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" }, "device_feature": { "external_id", "category", "type" }, "value": 1 }` |
| core → intégration | `external-integration.device.poll` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" } }` — demande de relève pour un device à `poll_frequency` ; les états remontent par `POST /state` |
| intégration → core | `external-integration.command-result` | `{ "message_id": "uuid", "success": true }` ou `{ "message_id": "uuid", "success": false, "error": "..." }` — ack de **toute** commande porteuse d'un `message_id`, attendu sous **5 s**, sinon la commande échoue côté core |
| core → intégration | `external-integration.scan-request` | `{}` — l'intégration répond en republiant `POST /discovered_device` |
| core → intégration | `external-integration.device-created` / `.device-updated` / `.device-deleted` | `{ "device": <device standard> }` (relais des hooks `postCreate`/`postUpdate`/`postDelete`) |
| core → intégration | `external-integration.config-updated` | `{ "config": { ... } }` — nouvelles valeurs complètes (pas besoin de re-fetch) |
| intégration → core | `external-integration.heartbeat` | `{}` — applicatif, optionnel si la lib WS répond aux pings protocole |

Convention de nommage des commandes : **un type spécifique par action**, `external-integration.<domaine>.<action>` — pas de type générique avec champ `action`. Les commandes futures (phase 2 : `camera.get-image`, `camera.start-streaming`… selon les types d'intégrations ajoutés) suivront ce schéma, chacune avec `message_id` + ack `command-result` ; une intégration ignore silencieusement un type qu'elle ne connaît pas.

Règles de fiabilité du protocole :
- **Pas de file d'attente** : les messages core→intégration (`device-created/updated/deleted`, `config-updated`, `scan-request`) émis pendant une déconnexion sont **perdus**. Contrat : à chaque (re)connexion, l'intégration refait `GET /device` et `GET /config` pour resynchroniser son état — le SDK le fait automatiquement.
- **Pas d'écho de config** : `config-updated` n'est poussé que pour les changements venant du front ; un `POST /config` de l'intégration elle-même ne déclenche jamais de `config-updated` en retour (sinon boucle).
- **`command-result` avec `success: false`** : traité côté core exactement comme un timeout — throw (`ExternalIntegrationUnavailableError` ou message d'erreur relayé), erreur visible dans l'UI device.

Santé : le core envoie un **ping WebSocket protocolaire** toutes les 20 s ; toute lib WS standard y répond automatiquement (pong). 2 pongs manqués ou socket fermée → statut `DEGRADED`. Une reconnexion remplace l'ancienne connexion enregistrée.

Messages core → front (UI temps réel, sur le WS utilisateur existant) : `external-integration.status-changed` `{ "selector", "status" }` et `external-integration.discovered-devices-updated` `{ "selector" }`.

### C.5 API de gestion (front ↔ serveur)

Routes `/api/v1/external_integration`, auth utilisateur Gladys standard ; **admin** requis pour tout ce qui modifie.

⚠️ **Collision `store` vs `:selector`** : les routes sont enregistrées dans Express dans l'ordre de déclaration de l'objet `routes.js` (`setupRoutes.js` itère `Object.keys`). Les routes littérales `store` et `store/refresh` doivent donc être déclarées **avant** `:selector` — précédent existant dans le code : `get /api/v1/device/duckdb_migration_state` déclaré avant `get /api/v1/device/:device_selector`. Double protection : les selectors d'intégrations sont préfixés `ext-` (B.1), `store` ne peut donc jamais être un selector valide ; et un test dédié vérifie que `GET .../store` renvoie le catalogue (pas le handler détail), pour casser la CI si quelqu'un réordonne les routes.

| Méthode & route | Corps → Réponse |
|---|---|
| `GET /api/v1/external_integration` | → `[ { "id", "name", "selector", "status", "version", "docker_image", "store_slug", "manifest", "update_available" } ]` |
| `GET .../:selector` | → détail (mêmes champs) |
| `GET /api/v1/external_integration/store` | → `{ "refreshed_at", "integrations": [ { "store_slug", "manifest": <manifeste>, "github": { "stars", "pushed_at" }, "installed": false, "update_available": false, "compatible": true } ] }` (filtré par `gladys_version`) |
| `POST .../store/refresh` *(admin)* | `{}` → index re-téléchargé, même réponse que `GET .../store` |
| `POST /api/v1/external_integration` *(admin)* | `{ "store_slug": "john/gladys-open-meteo-demo" }` **ou** `{ "repo_url": "https://github.com/john/gladys-open-meteo-demo" }` **ou** `{ "docker_image": "...", "manifest": {...} }` (mode dev) → `201` détail ; `repo_url` : `422` si manifeste absent/invalide dans le repo, `404` si repo introuvable |
| `POST .../:selector/start` / `stop` / `restart` / `update` *(admin)* | `{}` → `200` détail (statut à jour) |
| `GET .../:selector/logs?lines=200` *(admin)* | → `{ "logs": "<stdout/stderr bruts via docker logs>" }` |
| `GET .../:selector/discovered_device` | → `[ { ...device découvert, "created": false } ]` (flag = un device avec ce `external_id` existe déjà) |
| `POST .../:selector/scan` | `{}` → `200 { "success": true }` (relaie `scan-request` ; `400` si intégration déconnectée) |
| `GET .../:selector/config` | → `{ "config": { "latitude": 48.85, "api_key": null }, "configured_secrets": ["api_key"] }` — les `secret` sont toujours `null`, le flag dit s'ils sont renseignés |
| `POST .../:selector/config` *(admin)* | `{ "config": {...} }` validé contre le `config_schema` (`422` sinon) → `200` + push `config-updated` à l'intégration ; un `secret` à `null` = inchangé |
| `DELETE .../:selector` *(admin)* | → `200 { "success": true }` — supprime **tout** : conteneur, devices, variables de config, ligne `t_service` (confirmation explicite dans l'UI) |

### C.6 Formats publiés par l'indexeur

**`index.json`** (GitHub Pages, consommé par toutes les Gladys) :
```json
{
  "index_format": 1,
  "generated_at": "2026-07-13T08:00:00.000Z",
  "integrations": [
    {
      "store_slug": "john/gladys-open-meteo-demo",
      "repo_url": "https://github.com/john/gladys-open-meteo-demo",
      "manifest": { "...": "manifeste complet validé (C.1)" },
      "cover_url": "https://<pages-du-store>/covers/john--gladys-open-meteo-demo.jpg",
      "github": { "stars": 12, "pushed_at": "2026-07-10T12:00:00.000Z", "owner_avatar_url": "https://..." }
    }
  ]
}
```

**`rejected.json`** (diagnostic public en self-service ; `level: "error"` = non indexée, `level: "warning"` = indexée avec dégradation, ex. cover remplacée par un placeholder) :
```json
[
  { "store_slug": "jane/my-integration", "level": "error", "reason": "manifest.version: must be valid semver", "checked_at": "2026-07-13T08:00:00.000Z" },
  { "store_slug": "bob/gladys-foo", "level": "warning", "reason": "cover_image: expected 800x534, got 1200x800 — placeholder used", "checked_at": "2026-07-13T08:00:00.000Z" }
]
```

### C.7 Le conteneur d'intégration : descripteur Docker et environnement

Descripteur `createContainer` complet (généré par `buildContainerDescriptor.js`, même format que les descripteurs des services internes, ex. `server/services/zigbee2mqtt/docker/*.json`) :

```json
{
  "name": "gladys-ext-john-gladys-open-meteo-demo",
  "Image": "ghcr.io/john/gladys-open-meteo-demo:1.2.0",
  "Labels": {
    "io.gladysassistant.external-integration": "ext-john-gladys-open-meteo-demo"
  },
  "Env": [
    "GLADYS_HOST_API_URL=http://172.30.0.1:80",
    "GLADYS_INTEGRATION_TOKEN=<JWT>",
    "GLADYS_INTEGRATION_SELECTOR=ext-john-gladys-open-meteo-demo",
    "TZ=Europe/Paris"
  ],
  "HostConfig": {
    "NetworkMode": "gladys-integrations",
    "RestartPolicy": { "Name": "no" },
    "ReadonlyRootfs": true,
    "CapDrop": ["ALL"],
    "SecurityOpt": ["no-new-privileges"],
    "Memory": 268435456,
    "MemorySwap": 268435456,
    "NanoCpus": 500000000,
    "PidsLimit": 100,
    "Binds": ["/var/lib/gladysassistant/external-integrations/ext-john-gladys-open-meteo-demo:/data"],
    "Tmpfs": { "/tmp": "rw,noexec,nosuid,size=64m" },
    "LogConfig": { "Type": "json-file", "Config": { "max-size": "10m", "max-file": "2" } }
  },
  "AttachStdin": false,
  "AttachStdout": false,
  "AttachStderr": false,
  "Tty": false
}
```

Justification champ par champ :

| Champ | Valeur | Pourquoi |
|---|---|---|
| `name` | `gladys-<selector>` | retrouvable/déboguable en `docker ps` ; unicité garantie par le selector |
| `Labels` | selector en valeur | **clé de réconciliation** au boot et après backup/restore (B.2) ; permet aussi de retrouver les conteneurs orphelins d'intégrations désinstallées |
| `NetworkMode` | `gladys-integrations` | bridge dédié, `enable_icc=false` (B.2 réseau) |
| `RestartPolicy` | `no` | c'est le **superviseur** qui redémarre (backoff + machine à états) ; une policy Docker `always` le court-circuiterait |
| `ReadonlyRootfs` | `true` | seuls `/data` et `/tmp` sont inscriptibles |
| `CapDrop` | `ALL` | aucune capability Linux |
| `SecurityOpt` | `no-new-privileges` | pas d'escalade via binaires setuid |
| `Memory`/`MemorySwap` | 256 Mo (mêmes valeurs) | swap = memory ⇒ **pas de swap** ; OOM kill → restart supervisé |
| `NanoCpus` | `500000000` (0,5 CPU) | une intégration ne peut pas affamer Gladys sur Raspberry Pi |
| `PidsLimit` | 100 | anti fork-bomb |
| `Binds` | un seul : `<basePath>/external-integrations/<selector>:/data` | persistance locale de l'intégration ; survit aux recréations de conteneur, supprimé à la désinstallation |
| `Tmpfs /tmp` | `noexec,nosuid,64m` | scratch en RAM, pas d'exécution de binaires droppés |
| `LogConfig` | json-file 10 Mo × 2 | borne le disque (les logs sont lus via `docker logs`, cf. B.2) ; mêmes valeurs que le `docker run` de Gladys |
| `User` | *(non forcé)* | l'image choisit son user ; le template met `USER node` — forcer un uid arbitraire casserait des images légitimes |

**Ce qui n'est jamais accordé** (différences volontaires avec les conteneurs des services internes type z2m) : pas de `Devices` (`/dev`), pas de `Privileged`, pas de montage de la socket Docker, pas de `NetworkMode: host`, pas de ports publiés (`ExposedPorts`/`PortBindings` vides — le canal entrant, c'est le WS sortant de l'intégration).

**Variables d'environnement injectées** (contrat complet — rien d'autre n'est passé) :

| Variable | Exemple | Rôle |
|---|---|---|
| `GLADYS_HOST_API_URL` | `http://172.30.0.1:80` | base de l'API-hôte (C.2), sans slash final ; l'URL WS s'en déduit (`http→ws`, même hôte/port). **Valeur nominale : `http://172.30.0.1:80`** — gateway du bridge épinglée par IPAM + `SERVER_PORT` (80 sur l'install standard). Cas dégradés : subnet occupé → gateway auto-assignée lue via `inspectNetwork` ; Gladys en bridge → alias DNS `http://gladys:<port>` (B.2 réseau). **L'intégration doit toujours lire la variable**, jamais coder l'URL en dur — c'est la variable qui fait contrat, sa valeur n'est prévisible que pour le débogage |
| `GLADYS_INTEGRATION_TOKEN` | JWT | auth REST (`Authorization: Bearer`) et WS (`authenticate.integration-request`) ; régénéré à **chaque recréation** du conteneur (`token_version++`, B.3) |
| `GLADYS_INTEGRATION_SELECTOR` | `ext-john-gladys-open-meteo-demo` | selector de l'intégration, pour construire les `external_id` (`ext:<selector>:...`) |
| `TZ` | `Europe/Paris` | timezone configurée dans Gladys (variable système `TIMEZONE`), pour des logs et des crons cohérents |

Recréation de conteneur (update, régénération de token, changement de descripteur) = destroy + create avec les mêmes `Binds` : `/data` est la seule mémoire persistante du conteneur, tout le reste est jetable par design.

## Ordre d'implémentation (jalons PR-ables)

1. **PR 1 — Socle superviseur** : constantes (`SERVICE_TYPES`, `SERVICE_STATUS.DEGRADED`), migration `addColumn` sur `t_service` + modèle, `system.createNetwork|inspectNetwork|getImageLabels`, lib `external-integration` (sans WS/commandes), câblage `lib/index.js`, API admin + tests. → on installe/démarre/arrête un conteneur verrouillé via l'API.
2. **PR 2 — API-hôte** : `utils/integrationToken.js` (génération/validation JWT), middleware, flag `externalIntegrationAuth`, contrôleur `/api/integration/v1/*` (discovered_device, device en lecture, state, config) + tests d'isolation. → une intégration publie ses appareils découverts et des états.
3. **PR 3 — WS + commandes + santé** : extension WebsocketManager, connected/disconnected, `sendCommand` + ack/timeout, proxy-service (setValue + postCreate/postUpdate/postDelete), scan request, heartbeat, checkHealth + backoff + DEGRADED/FAILED. → machine à états complète, `setValue` atteint le conteneur, l'intégration est notifiée des créations/suppressions.
4. **PR 4 — Store côté serveur** : migration `store_slug`, lib `store/` (fetch + cache + compatibilité + updates), endpoints `GET .../store`, `POST .../store/refresh`, install par `store_slug`, `POST .../:selector/update` + tests. En parallèle (hors monorepo) : repo `GladysAssistant/integration-store` (Action d'indexation, JSON Schema du manifeste, GitHub Pages). → le catalogue est alimenté par l'index, install/update en un clic par API.
5. **PR 5 — Front** : intégrations externes du store dans le catalogue (badge « externe », écran d'installation avec avertissement, statut temps réel, mise à jour disponible, install dev), page générique 3 écrans Appareils/Découverte/Configuration (formulaire généré depuis `config_schema`), logs, i18n.
6. **PR 6 — SDK + template + PoC + doc** : `integration-sdk/node`, template de repo publiable (manifeste + workflow de build d'image prêt), exemple demo, doc API-hôte + doc « publier son intégration », parcours e2e documenté.

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
- `front/src/routes/integration/index.js` + `front/src/config/integrations/devices.json` — catalogue d'intégrations à fusionner avec la liste dynamique
- `front/src/routes/integration/all/zigbee2mqtt/` — modèle de page 3 onglets (device/discover/setup) ; `front/src/routes/integration/all/mcp/` — modèle d'appels API

## Vérification

1. `cd server && npm test` (patch coverage 100 %), `npm run compare-translations` côté front, lint des deux workspaces.
2. **Parcours e2e manuel** (environnement avec socket Docker) : publier l'intégration demo comme le ferait un dev tiers (repo public + topic `gladys-assistant-integration` + `gladys-assistant-integration.json` + image poussée sur un registre public) → attendre/déclencher l'indexation → la demo apparaît dans le catalogue de Gladys avec le badge « externe », **sans aucune approbation** → installation en un clic (écran d'avertissement) → la carte apparaît dans la liste avec le badge « externe », statut `Démarrage → En fonctionnement` en temps réel → écran Configuration : formulaire latitude/longitude généré depuis le `config_schema`, sauvegarde → l'intégration reçoit `CONFIG_UPDATED` → les appareils demo apparaissent dans l'écran Découverte → création depuis l'UI → l'intégration reçoit `DEVICE_CREATED` et publie ses états, devices visibles dans l'écran Appareils et le dashboard → actionner l'interrupteur virtuel (commande reçue dans les logs du conteneur, état republié) → `docker kill` du conteneur → statut `Dégradée` puis redémarrage auto → forcer 5 crashs → statut `En panne` avec logs visibles et bouton redémarrer → bumper `version` dans le manifeste du repo demo → après ré-indexation, badge « mise à jour disponible » → update en un clic (nouveau conteneur, ancien JWT invalidé) → désinstallation propre (conteneur supprimé, ligne `t_service` détruite, ancien JWT refusé).
3. Test d'isolation manuel : appeler l'API-hôte avec le token d'une intégration sur les devices d'une autre → 403/404 ; avec un access token utilisateur → 401 (mauvaise audience) ; avec un token d'ancienne `token_version` après recréation du conteneur → 401.
