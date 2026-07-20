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
- **Intégrations multi-conteneurs** : certaines intégrations ont besoin de conteneurs additionnels (cas Frigate : conteneur Frigate + broker Mosquitto, avec UI web accessible sur le LAN et accès au Coral). Le manifeste **déclare** ce qui peut tourner — images, limites, ports publiés, accès matériel — et c'est ce que l'utilisateur approuve à l'installation ; l'intégration **pilote ensuite le cycle de vie via l'API-hôte** (créer/démarrer/arrêter/redémarrer, uniquement dans les bornes déclarées). Données confinées au dossier de l'intégration, suppression totale à la désinstallation, et **jamais** d'accès à la socket Docker.

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
- **Manifeste** : fichier **`gladys-assistant-integration.json` à la racine du repo GitHub** — c'est lui que le robot du store scrape (source de vérité pour l'index) — et dupliqué dans l'image Docker (LABEL `io.gladysassistant.manifest`, pour l'install « dev » par nom d'image sans repo). Contenu : nom, version, versions Gladys compatibles, **`config_schema`** (décrit le formulaire de l'écran Configuration, cf. B.8). Champ `manifest_version: 1` figé dès la v1. Pas de système de permissions en v1 (non applicable techniquement, cf. B.14).
- **Une intégration externe est un service** : ligne `t_service` avec `type: 'external'`, devices rattachés normalement, et un *proxy service* dans le stateManager (start/stop/setValue) qui l'insère dans le cycle de vie existant **sans modifier le core device ni le core service**.
- **Sous-conteneurs : déclaration + API de cycle de vie** : le manifeste déclare les conteneurs additionnels autorisés (champ `containers`, cf. C.1 — images, volumes, limites, ports publiés, accès matériel), et l'API-hôte `/container` (C.3) permet à l'intégration d'en piloter le cycle de vie **dans ces bornes**. Le superviseur exécute tout : réseau privé par intégration, même sandbox, volumes dérivés sous le dossier de l'intégration, suppression totale à la désinstallation (détail en B.2, contrats C.1/C.3/C.7).
- **Store décentralisé** : publier une intégration = créer un repo GitHub public avec le topic `gladys-assistant-integration` et un manifeste à la racine. Un indexeur automatique (repo `GladysAssistant/integration-store`, GitHub Action planifiée) crawle le topic, valide par script, publie un `index.json` statique sur GitHub Pages/CDN. Gladys télécharge et cache cet index → catalogue, installation en un clic, détection de mises à jour (détail en B.9).

### Phases livrables

| Phase | Contenu | Livrable observable |
|---|---|---|
| **1** | API-hôte + WS, superviseur, auth, API admin, **store décentralisé** (indexeur + catalogue + install 1 clic + mises à jour), front au niveau des intégrations internes : entrée dans le catalogue (badge « externe ») + page générique à 3 écrans Appareils / Découverte / Configuration (formulaire généré depuis le `config_schema`), SDK Node (repo dédié), template/PoC (repo dédié), **documentation publique sur le site** (interne vs externe + guide développeur). Install « dev » par image Docker conservée. | N'importe quel dev tague son repo → son intégration apparaît dans le catalogue de toutes les Gladys sans aucune approbation → un utilisateur l'installe en un clic, ses appareils découverts sont créés depuis l'UI, actionnables, configurables via formulaire généré ; l'intégration survit à un kill (redémarrage auto), passe « En panne » avec logs après échecs répétés. |
| **2** | Découverte réseau médiée (broadcast/mDNS/SSDP capturés par le core — design complet en B.16), widgets de config avancés, autres types d'intégrations que « Appareils » — en premier lieu le type « communication » pour sortir Telegram & co du core (design complet en B.15), puis météo…. | Une intégration détecte son matériel sans config manuelle ; un canal de messagerie s'installe depuis le store. |
| **3** | Écosystème : SDKs communautaires d'autres langages, ranking/stats du store, durcissement supply-chain (épinglage par digest, signature d'images ?). | Écosystème auto-suffisant, sans intervention du mainteneur. |

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
| `granted_devices` | JSON nullable | classes d'accès matériel **accordées par l'utilisateur** (sous-ensemble des classes demandées par le manifeste, cf. B.2) ; null = aucune |

Toutes nullables/défaut pour les services internes existants. **Dérivation du `selector`** (et du `name`) : préfixe `ext-` pour éviter toute collision avec un futur service natif (`service.load` cherche par `(pod_id: null, name)`), puis — install store ou `repo_url` : `ext-<owner>-<repo>` slugifié, **unique par construction** (c'est le `store_slug`) ; install dev par image : `ext-dev-<name du manifeste slugifié>`, suffixe numérique en cas de collision.

- **Statuts** : réutiliser `SERVICE_STATUS` existant en y ajoutant **une seule valeur : `DEGRADED`**. Projection de la machine à états RFC : Installée→`ENABLED`, Démarrage→`LOADING`, En fonctionnement→`RUNNING`, Dégradée→`DEGRADED`, En panne→`ERROR`, Arrêtée→`STOPPED`.
- **Logs : ni table, ni push.** L'intégration écrit sur stdout/stderr ; Gladys consulte les logs à la demande via l'API Docker (`system.getContainerLogs(container_id)` existant, équivalent `docker logs`).
- **Constantes** (`server/utils/constants.js`) : `SERVICE_STATUS.DEGRADED`, `SERVICE_TYPES`, `EVENTS.EXTERNAL_INTEGRATION.*`, `WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.*` (front : `STATUS_CHANGED`, `DISCOVERED_DEVICES_UPDATED`, `CONNECTION_STATUS_UPDATED` ; intégration : `DEVICE_SET_VALUE`, `DEVICE_POLL`, `COMMAND_RESULT`, `SCAN_REQUEST`, `DEVICE_CREATED`, `DEVICE_UPDATED`, `DEVICE_DELETED`, `HEARTBEAT`, `CONFIG_UPDATED`, `HARDWARE_UPDATED`, `OAUTH_GET_AUTHORIZE_URL`, `OAUTH_CALLBACK`, `ACTION_RUN`, `CAMERA_GET_IMAGE`), `AUTHENTICATION.INTEGRATION_REQUEST`.
- **Appareils découverts : pas de table.** La liste des appareils découverts publiée par chaque intégration est tenue **en mémoire** dans le superviseur (comme le font les handlers des services internes, ex. philips-hue), perdue au redémarrage et republiée par l'intégration à sa connexion.

### B.2 Superviseur — `server/lib/external-integration/`

Pattern prototype « une fonction par fichier » (comme `server/lib/system/`). Injecté dans `server/lib/index.js` (avec le `jwtSecret`, comme `Session`) ; `init()` appelé **avant** `service.startAll()` : il enregistre les proxy-services dans le stateManager, et `startAll` démarre alors intégrations internes et externes par le même chemin (+ flag `disableExternalIntegration` pour les tests).

Fichiers principaux : `index.js` (constructeur : maps connexions WS, commandes en attente, timers), `externalIntegration.init.js` (charge les `t_service` de type `external`, **réconcilie** les conteneurs par label — cas restore de backup —, enregistre les proxy-services), `install.js` (résolution du manifeste — depuis l'index du store, ou via les labels de l'image en mode dev — → pull → validation → création ligne `t_service` type `external` → génération du JWT (B.3) → conteneur → start), `buildContainerDescriptor.js`, `start/stop/restart/uninstall.js` (start/stop appelés aussi via le proxy-service par le cycle de vie standard ; **uninstall supprime tout** : stop + suppression du conteneur, des éventuels sous-conteneurs et de leur réseau privé (voir plus bas), des devices, des variables de config, puis destroy `t_service` — pas d'option « conserver les devices », `t_device.service_id` est une FK obligatoire et des devices orphelins n'existent pas dans le modèle ; l'utilisateur retrouve tout via la Découverte s'il réinstalle), `saveStatus.js` (update `t_service.status` + `EVENTS.WEBSOCKET.SEND_ALL`), `checkHealth.js` (toutes les 30 s), `scheduleRestart.js` (backoff `min(10s·2^n, 15min)`), `integrationConnected/Disconnected.js`, `sendCommand.js` (message_id + ack, **timeout 5 s**), `registerProxyService.js`, `getLogs.js` (simple délégation à `system.getContainerLogs(container_id)`).

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
- **Limite bridge assumée : pas de broadcast/multicast LAN entrant.** Les paquets broadcast, mDNS ou SSDP émis sur le LAN ne traversent pas le bridge NAT — vérifié sur un cas réel : le scan local Tuya (`tuya.localScan.js`) écoute des broadcasts UDP (ports 6666/6667/7000) et ne fonctionnerait pas dans un conteneur bridge (le core s'en sort uniquement parce qu'il est en `network=host`). L'**unicast** LAN sortant, lui, traverse le NAT : joindre une IP connue (obtenue d'un cloud, saisie en config) ou une API cloud fonctionne. La **découverte médiée** (le core, en host, capture et relaie — design complet en B.16) est l'objet de la phase 2 — à documenter honnêtement d'ici là (B.12).

**Sous-conteneurs (intégrations multi-conteneurs, ex. Frigate + Mosquitto).** Une intégration qui a besoin d'autres conteneurs ne reçoit jamais la socket Docker ni une API de création libre. Le modèle est en deux temps :
- le **manifeste déclare** (champ `containers`, C.1) tout ce qui peut tourner — images, volumes, limites, ports publiés, accès matériel. C'est le **contrat d'autorisation** : affiché sur l'écran d'installation (et visible dans le catalogue), c'est ce que l'utilisateur approuve ;
- l'**API-hôte pilote** (endpoints `/container`, C.3) le cycle de vie — créer/démarrer/arrêter/redémarrer, **uniquement les entrées déclarées**, au moment choisi par l'intégration.

On a ainsi la souplesse d'une API impérative (préparer des fichiers avant le premier démarrage, redémarrer après un changement de config, arrêter un composant inutile) sans perdre la transparence : rien ne peut tourner qui n'ait été montré à l'installation. Piste phase 2 : instances dynamiques d'une entrée déclarée (ex. un conteneur par caméra).

- **Démarrage** : chaque entrée déclare `start: "auto"` (défaut — le superviseur crée et démarre le sous-conteneur avant le principal : zéro code pour le cas simple) ou `"manual"` (rien ne démarre tant que l'intégration n'appelle pas `POST /container/:name/start` — le cas Mosquitto : générer le fichier de mots de passe dans `/data` **avant** le premier démarrage, pour ne jamais faire tourner un broker non configuré).
- **État désiré** : le superviseur mémorise ce qui doit tourner (`auto`, ou démarré via l'API et pas arrêté via l'API). Un conteneur « censé tourner » qui exit est redémarré avec le même backoff et incrémente le même `failure_count` que le principal (≥ 5 → `ERROR`, tout est arrêté) ; un conteneur arrêté par l'intégration reste arrêté. La machine à états globale reste pilotée par le conteneur principal (WS/heartbeat) ; l'état individuel des sous-conteneurs est visible dans le bloc de supervision du front (B.8). Les start/stop/restart demandés par l'intégration n'incrémentent pas le compteur (gestes volontaires, pas des crashs).
- **Réseau privé par intégration** : bridge `gladys-int-<selector>` (icc **actif** à l'intérieur — Frigate doit joindre Mosquitto), créé à l'install, supprimé à la désinstallation. Alias DNS = le `name` de chaque sous-conteneur : le principal joint simplement `mqtt:1883` ou `frigate:5000`. Le conteneur principal est connecté aux **deux** réseaux (privé + `gladys-integrations`) ; les sous-conteneurs ne rejoignent **jamais** `gladys-integrations` — pas de token, pas d'accès à l'API-hôte, invisibles des autres intégrations.
- **Ports publiés** : chaque port déclaré est publié sur un **port hôte choisi par Gladys** (port libre, alloué au premier démarrage puis **persisté** — stable à travers les recréations), jamais par le manifeste : aucune collision possible entre intégrations ou avec un service de l'hôte. Le front affiche un lien « Ouvrir <label> » dans le bloc de supervision (l'UI de Frigate est à un clic) ; l'intégration lit le port assigné via `GET /container`. Publier un port = exposer une interface tierce sur le LAN : c'est dit sur l'écran d'installation (B.14.8).
- **Accès matériel : demandé par le manifeste, accordé par l'utilisateur.** Le manifeste demande des **classes d'accès nommées**, jamais des chemins : en v1 `coral-usb` (`/dev/bus/usb`), `coral-pcie` (`/dev/apex_*`), `gpu` (`/dev/dri`), `video` (`/dev/video*`). Le flow utilisateur, entièrement dans l'UI de Gladys :
  1. **Détection** : `system.detectHardwareClasses()` (nouveau, best effort : présence des chemins `/dev` correspondants — fonctionne avec l'install standard de Gladys ; sinon la classe est montrée « non détectée ») alimente l'écran d'installation ;
  2. **Consentement granulaire** : l'écran d'installation affiche chaque classe demandée avec son état de détection (« Coral USB détecté » / « non détecté ») et un **interrupteur par classe** — pré-coché si détecté, décochable ; l'utilisateur peut refuser une classe présente ou accorder une classe absente (matériel branché plus tard). Le choix est persisté dans `t_service.granted_devices` (B.1) ;
  3. **Montage** = intersection **demandé ∩ accordé ∩ présent**, résolue à chaque création de conteneur — brancher un Coral puis recréer suffit ;
  4. **Modifiable à tout moment** : une section « Matériel » du bloc de supervision (écran Configuration, admin) reprend les mêmes interrupteurs ; un changement recrée les sous-conteneurs concernés et notifie l'intégration par WS (`hardware-updated`, C.4) pour qu'elle régénère sa config (ex. Frigate : détecteur `edgetpu` si le Coral est accordé et disponible, sinon `cpu`) et redémarre ce qu'il faut.

  L'intégration n'a donc pas à « détecter » elle-même côté UI : elle lit l'état accordé/disponible via `GET /container` (C.3) et s'adapte. Un chemin arbitraire (`/dev/sda`…) reste impossible par construction.
- **Cycle de vie atomique** : install = pull de toutes les images + création du réseau privé (les entrées `auto` sont créées/démarrées, les `manual` attendent l'API) ; stop de l'intégration = tout s'arrête (principal d'abord) ; update = recréation de l'ensemble selon le nouveau manifeste ; **désinstallation = tout part** (conteneurs, réseau privé, ports libérés, dossier data). Les sous-conteneurs portent les mêmes labels de réconciliation (C.7) : même après un crash de Gladys au milieu d'une opération, le boot suivant détruit les orphelins — aucun conteneur fantôme possible.
- **Données confinées par construction** : chaque volume déclaré est monté depuis `<basePath>/external-integrations/<selector>/containers/<name><chemin>` — le chemin hôte est **dérivé par le superviseur, jamais choisi par le manifeste** : un sous-conteneur ne peut pas écrire hors du dossier de son intégration. Le conteneur principal, qui monte tout `<selector>:/data`, voit ces volumes sous `/data/containers/<name>/...` : c'est le **canal de configuration prévu** — générer les fichiers de config au runtime (ex. `config.yml` de Frigate, credentials Mosquitto : les secrets ne passent jamais par le manifeste, qui est public), puis démarrer ou redémarrer le sous-conteneur via l'API.

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
| `POST /discovered_device` (batch, remplace la liste) | stocké en mémoire par le superviseur (`external_id` préfixés `ext:<selector>:` forcés) ; push front `DISCOVERED_DEVICES_UPDATED` ; le superviseur marque ceux déjà créés en DB (match `external_id`) et **upsert silencieusement leurs `params`** (cf. C.3) |
| `GET /device` | **lecture seule** : les devices de l'intégration réellement créés par l'utilisateur (`service_id` forcé) — permet à l'intégration de savoir quoi piloter/poller au démarrage |
| `POST /state` (batch) | `EVENTS.DEVICE.NEW_STATE` (chemin des services natifs) ; rate-limit 300 états/min (cf. C.3) |
| `POST /camera/image` | `gladys.device.camera.setImage` — nouvelle image d'une caméra de l'intégration (≤ 150 Ko, 12/min par device, cf. C.3) |
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

Aucune modification de `device.setValue.js` ni de `device.notify.js` : `registerProxyService.js` pose dans le stateManager, sous le nom du `t_service` de l'intégration, un objet gelé `{ device: { setValue, poll, getImage, postCreate, postUpdate, postDelete } }` — `setValue` envoie `DEVICE_SET_VALUE`, `poll` envoie `DEVICE_POLL` (appelé par le scheduler core pour les devices à `poll_frequency`, comme pour les services internes), `getImage` envoie `CAMERA_GET_IMAGE` (appelé par `camera.getLiveImage` — vue live, intent chat — timeout 15 s, l'image revient dans `command-result.data`), les trois hooks relaient les notifications de cycle de vie (B.5). `sendCommand(type, payload)` → WS + ack (timeout 5 s par défaut — `action.run` utilise le `timeout_seconds` déclaré de l'action, cf. C.1 ; dépassement → throw, ex. nouvelle `ExternalIntegrationUnavailableError` dans `utils/coreErrors.js`) ; intégration déconnectée → throw immédiat. **Exception pour `poll`** : si l'intégration n'est pas `RUNNING`/`DEGRADED` (arrêtée volontairement, en panne), le `poll` planifié par le scheduler devient un **no-op silencieux** — ni throw ni log répété toutes les N secondes (pollution de logs pour un état déjà connu et affiché) ; `setValue`, lui, throw toujours : l'utilisateur qui actionne un appareil doit voir l'erreur. Retour d'état réel via `POST /state` (documenter `has_feedback: true` pour les features actionnables).

### B.7 API de gestion (admin)

`server/api/controllers/externalIntegration.controller.js`, opérant sur les lignes `t_service` de type `external` (pas de nouvelle table). **Contrats détaillés en C.5.**

- **Admin** : `POST /api/v1/external_integration` avec **trois modes d'installation** — `{ store_slug }` (depuis le store, le serveur résout image + manifeste depuis son cache d'index), `{ repo_url }` (**depuis une URL de repo GitHub**, indexé ou non : le serveur résout la branche par défaut via l'API GitHub, télécharge `gladys-assistant-integration.json` en raw, le valide avec le même JSON Schema que l'indexeur, puis suit le chemin d'install standard ; `store_slug` est déduit = `owner/repo`), `{ docker_image, manifest }` (mode dev sans repo). Puis `POST .../:selector/update` (pull + recréation du conteneur), `POST .../start|stop|restart`, `GET .../logs`, `DELETE` (supprime **tout** : conteneur, devices, config — cf. B.2).
- **Utilisateur standard** : `GET /api/v1/external_integration` (liste + statut, alimente le catalogue d'intégrations du front, cf. B.8), `GET .../:selector` (détail : manifeste, `config_schema`, statut) et `GET /api/v1/external_integration/store` (catalogue du store depuis le cache d'index serveur, filtré par compatibilité de version Gladys, avec recherche + flags « installée » / « mise à jour disponible » ; `POST .../store/refresh` pour re-télécharger l'index à la demande).
- **Écran Découverte** : `GET /api/v1/external_integration/:selector/discovered_device` (liste mémoire du superviseur, avec le flag « déjà créé ») et `POST .../scan` (envoie `SCAN_REQUEST` à l'intégration). La création du device se fait ensuite par le `POST /api/v1/device` existant, comme pour les intégrations internes.
- **Écran Configuration** : `GET/POST /api/v1/external_integration/:selector/config` — valide le payload contre le `config_schema` du manifeste (format plat spécifié en C.1), persiste via `gladys.variable.setValue(key, service_id)` (les champs `secret: true` ne sont jamais renvoyés en clair par le `GET`), puis pousse `CONFIG_UPDATED` à l'intégration par WS pour qu'elle recharge sa config sans redémarrage.

### B.8 Front : au même niveau que les intégrations internes

Pas de page « à part » dans les Paramètres : une intégration externe se présente et s'utilise **exactement comme une intégration interne**, avec juste un badge « externe ». Un seul type géré en phase 1 : les intégrations de type **« Appareils »** (catégorie `device` du catalogue).

**Dans le catalogue d'intégrations** (`front/src/routes/integration/index.js`) : aujourd'hui la liste vient de JSON statiques (`front/src/config/integrations/devices.json`). On y fusionne les intégrations externes du **store** (`GET /api/v1/external_integration/store`, cf. B.9) — mêmes cartes (nom, cover re-hébergée par l'indexeur — `cover_url` — ou placeholder), plus un **badge « externe »**, et pour celles installées le badge de statut temps réel (`STATUS_CHANGED`) et le flag « mise à jour disponible ». La liste affichée est l'**union** de `GET /api/v1/external_integration` (installées — y compris celles hors index : install par `repo_url` pas encore crawlée, mode dev) et de `GET .../store` (index), **dédupliquée par `store_slug`** : une intégration installée n'apparaît qu'une fois, avec son statut. Cliquer sur une intégration non installée ouvre un écran d'installation : description, lien « **Documentation** » (markdown re-hébergé par l'indexeur, `docs` de C.6, langue utilisateur avec fallback `en`), avertissement clair (code tiers non audité, accès réseau sortant complet), la liste des éventuels sous-conteneurs (nom, image, limites mémoire/CPU, ports publiés — l'utilisateur voit ce qui va tourner chez lui et ce qui sera exposé sur son réseau), la section **Matériel** (une ligne par classe demandée : état de détection + interrupteur d'octroi, cf. B.2), bouton « Installer » (un clic).

**Installer hors store — parcours grand public, pas un « mode dev » caché.** Une **carte dédiée en fin de catalogue** (catégorie Appareils), « Installer depuis GitHub », ouvre une modal où l'utilisateur colle simplement l'**URL d'un repo GitHub** ; Gladys récupère et valide le manifeste du repo, affiche le même écran d'installation (nom, description, avertissement) et installe (`POST` avec `repo_url`, cf. C.5). C'est le chaînon entre le store et le partage direct : beta-test d'une intégration, repo pas encore crawlé par l'indexeur, intégration confidentielle. Dans la même modal, un lien discret « Mode développeur » révèle le formulaire avancé image Docker + manifeste inline (pour travailler sans repo). **Avertissement double instance** : à l'installation (tous modes — store, `repo_url`, dev), si une intégration déjà installée partage la même image Docker (comparaison **sans le tag** : une `:dev` à côté d'une `:1.2.0`) ou le même `name` de manifeste, l'écran d'installation prévient : « une autre instance de cette intégration tourne déjà — deux instances peuvent se disputer le même compte cloud ou les mêmes appareils ; conseil : arrêter l'instance existante pendant vos tests ». L'installation reste possible — faire tourner une version dev à côté de la prod est un usage **voulu** (les selectors `ext-dev-*` garantissent l'absence de collision technique) ; le conflit potentiel est métier, l'utilisateur décide en connaissance de cause. Note : comme toute installation, l'action reste réservée au rôle admin — la catégorie Appareils du catalogue est de toute façon masquée aux non-admins dans le front actuel — mais l'UX est pensée pour un utilisateur non technique : coller une URL, cliquer Installer.

**Une page générique unique** `front/src/routes/integration/all/external-integration/` sert toutes les intégrations externes, sur le modèle exact des pages internes (sidebar `Zigbee2mqttPage`-like, routes dynamiques dans `front/src/components/app.jsx`), avec les 3 écrans :

| Écran | Route | Contenu |
|---|---|---|
| **Appareils** | `/dashboard/integration/device/external/:selector` | Les appareils déjà créés de l'intégration (mêmes cartes/édition que les device-pages internes, filtrées par le `t_service` de l'intégration) |
| **Découverte** | `.../discover` | Appareils découverts (nom, features, badge « déjà créé »), bouton « Scanner » (`POST .../scan`), bouton « Créer » par appareil (`POST /api/v1/device` standard), bouton « **Mettre à jour** » quand un appareil déjà créé est re-publié avec une structure différente (features — applique la nouvelle définition via le même `POST /api/v1/device` ; les `params` seuls, eux, sont upsertés automatiquement, cf. C.3), temps réel via `DISCOVERED_DEVICES_UPDATED` |
| **Configuration** | `.../config` | **Formulaire généré depuis le `config_schema` JSON du manifeste** (UI déclarative de la RFC : champs texte/nombre/booléen/select/secret/oauth2 en v1 — le champ `oauth2` est un bouton « Connecter », cf. C.1 —, aucun code injecté), sauvegarde via `POST .../config`. La page générique gère aussi la **route de callback OAuth** (`.../oauth-callback?code&state`) qui relaie au serveur (C.5) puis referme le flow. S'y ajoutent la section **Actions** (un bouton par action déclarée dans le manifeste, mini-formulaire si `fields`, résultat affiché sous le bouton — cf. C.1) et le bloc de supervision : statut conteneur **et statut de connexion applicatif** publié par l'intégration (`connection_status` C.3 — badge + message, ex. « token expiré, reconnectez-vous »), **heure de démarrage du conteneur** (`started_at`, « en fonctionnement depuis… »), actions start/stop/restart, modal logs, désinstaller (admin) ; pour les intégrations multi-conteneurs, l'état de chaque sous-conteneur, un sélecteur de conteneur dans la modal logs, un lien « Ouvrir <label> » par port publié (ex. l'UI de Frigate, `http://<hôte-gladys>:<port assigné>`), et la section **Matériel** (mêmes interrupteurs qu'à l'install, admin — modifier recrée les sous-conteneurs concernés, cf. B.2) |

Modèles de code : `front/src/routes/integration/all/zigbee2mqtt/` (structure 3 onglets device/discover/setup) et `front/src/routes/integration/all/mcp/` (appels API). i18n dans **toutes** les langues (`front/src/config/i18n/*.json`, check `compare-translations`) — les libellés des champs de config viennent du manifeste (avec clés multi-langues optionnelles), pas des fichiers i18n de Gladys.

### B.9 Le store : index décentralisé auto-généré

**Principe : publier ne demande la permission de personne.** La source de vérité est distribuée sur GitHub ; l'index n'est qu'un cache public reconstruit par un robot.

**Côté développeur d'intégration** — publier =
1. repo GitHub **public** avec le topic **`gladys-assistant-integration`** ;
2. un fichier **`gladys-assistant-integration.json`** à la racine (le manifeste : `manifest_version`, `slug` implicite = `owner/repo`, nom, description multi-langue, `version`, `docker_image` — n'importe quel registre public, tag ou digest —, versions Gladys compatibles, `config_schema`, URL d'image de couverture) ;
3. une **documentation utilisateur multi-langue obligatoire** : `docs/en.md` **et** `docs/fr.md` (les deux langues du projet ; autres langues bienvenues), structurés selon le **template fourni** (B.11 : sections Présentation / Prérequis / Configuration / Dépannage). L'indexeur vérifie la présence des deux fichiers et une taille minimale (≥ 300 caractères chacun) — absents ou vides → **rejet** (`level: "error"` dans `rejected.json`) ; le respect fin des sections reste conventionnel. Les fichiers sont **re-hébergés** sur Pages comme les covers (`docs` dans l'index, cf. C.6) et affichés dans l'écran d'installation ;
4. publier une nouvelle version = bumper `version` + `docker_image` dans le manifeste et pousser. C'est tout — pas de compte à créer, pas de PR à faire approuver.

Le même manifeste est dupliqué dans l'image Docker (LABEL `io.gladysassistant.manifest`, le template le fait automatiquement au build) : le fichier du **repo** fait foi pour le store (c'est lui que le robot scrape) ; le **LABEL** ne sert qu'à l'install « dev » par nom d'image, sans repo GitHub. À l'installation depuis le store, c'est la version de l'index qui est enregistrée dans `t_service.manifest`.

**L'indexeur** — nouveau repo public `GladysAssistant/integration-store` (hors monorepo) :
- GitHub Action **planifiée toutes les heures** (+ déclenchable manuellement) : recherche GitHub par topic → fetch du `gladys-assistant-integration.json` de chaque repo (raw.githubusercontent) → **validation par script uniquement** (JSON Schema du manifeste, référence d'image bien formée, `manifest_version` supporté, cover téléchargée/validée/re-hébergée cf. C.1, documentation `docs/en.md` + `docs/fr.md` présente/re-hébergée sinon rejet) → construction de `index.json` enrichi des métadonnées GitHub (stars, date de dernier commit — ranking gratuit sans télémétrie centralisée) → publication sur **GitHub Pages** (statique, CDN). Formats `index.json`/`rejected.json` spécifiés en C.6.
- Les manifestes invalides sont listés dans un `rejected.json` public avec la raison → un dev diagnostique seul pourquoi son intégration n'apparaît pas, sans ouvrir de ticket.
- Le code de validation est public : les règles d'admission sont vérifiables par tous, et n'importe qui peut re-générer l'index (fork de l'Action) — le store lui-même est forkable, donc pas de point de contrôle.
- **Aucune modération en v1** (choix assumé) : pas de blocklist, pas de retrait manuel. La défense, c'est la sandbox (B.2) + l'avertissement à l'installation. Une blocklist resterait ajoutable plus tard côté indexeur sans toucher au client.

**Côté Gladys** — sous-dossier `store/` du superviseur (`store.getIndex.js`, `store.refreshIndex.js`, `store.checkForUpdates.js`) :
- télécharge `index.json` (URL par défaut surchargeable par variable — utile pour les tests et pour pointer un index alternatif), **cache local persistant** (fichier ou `t_variable`) rafraîchi toutes les 12 h : le catalogue reste consultable hors ligne ou si GitHub Pages est indisponible, et les intégrations installées ne dépendent jamais de l'index pour fonctionner ;
- filtre par compatibilité de version Gladys avant d'exposer au front ;
- compare `index.version` vs `t_service.version` (lien par `store_slug`) → flag « mise à jour disponible », l'update est un geste admin explicite (pas d'auto-update en v1) ;
- pour les intégrations installées par `repo_url` (cf. C.5) absentes de l'index, le refresh re-télécharge directement le manifeste de leur repo — même mécanique de détection de mise à jour, sans dépendre du crawl.

**Résilience, en résumé** : GitHub Pages statique en façade (pas de rate limit, CDN), cache local en second rideau, runtime totalement découplé du store en dernier ressort. Le pire scénario (GitHub entièrement down) suspend la découverte de nouvelles intégrations, jamais le fonctionnement de l'existant.

### B.10 SDK JS : repo dédié `GladysAssistant/integration-sdk-js`

**Repo dédié dès la phase 1** (pas un dossier du monorepo) : versioning npm indépendant du rythme de release Gladys, CI propre, et c'est la dépendance que les devs tiers installent — ils n'ont pas à toucher au monorepo. Il ne dépend **que des contrats C.2–C.4** (aucun import du code Gladys).

- **Paquet npm `@gladysassistant/integration-sdk`** : Node ≥ 20, une seule dépendance runtime (`ws`), typings TypeScript fournis (`.d.ts`), CommonJS + ESM. **API publique complète spécifiée en C.8.**
- Le repo ne contient **que la bibliothèque** (+ ses tests contre un faux serveur, cf. B.13) : l'intégration d'exemple complète vit dans le repo template (B.11). Le README garde un snippet minimal de prise en main et pointe vers le template et la doc du site (B.12).
- Pas de helper de logs : l'intégration loggue sur stdout/stderr, récupérés par `docker logs`.

### B.11 Template d'intégration : repo dédié `GladysAssistant/integration-template-js`

Repo public marqué **« Template repository » GitHub** dès sa création : « Use this template » + éditer le manifeste + taguer le topic = être dans le store. C'est à la fois le **point de départ officiel** d'un dev tiers et le **PoC** utilisé dans le parcours e2e (section Vérification) — il est publié dans le store exactement comme le ferait un dev tiers (topic + image sur registre public), ce qui valide le chemin « zéro approbation » de bout en bout.

**Contenu = une intégration complète et fonctionnelle** (testable sans matériel, couvre tout le cycle y compris les 3 écrans) : publie deux appareils découverts — un capteur température Open-Meteo (API publique sans clé) et un interrupteur virtuel. L'utilisateur les crée depuis l'écran Découverte ; l'intégration publie alors la température toutes les 10 min et répond aux commandes de l'interrupteur (reçoit `onSetValue`, republie l'état). Son manifeste embarque un `config_schema` (latitude/longitude + intervalle de rafraîchissement) pour exercer le formulaire généré de l'écran Configuration et `onConfigUpdated`.

Fichiers du repo :
- `index.js` : l'intégration demo, construite sur `@gladysassistant/integration-sdk` (~40 lignes, cf. C.8) ; pendant le développement parallèle des chantiers, dépendance installée depuis le repo git du SDK, basculée sur la version npm avant publication ;
- `gladys-assistant-integration.json` à la racine (manifeste conforme C.1, y compris les bornes name/description) + `cover.jpg` conforme (800×534, ≤ 150 Ko) ;
- `docs/en.md` + `docs/fr.md` pré-remplis : c'est **le template officiel de la documentation obligatoire** du store (B.9) — sections Présentation / Prérequis / Configuration / Dépannage, à adapter ;
- `Dockerfile` : `node:22-alpine`, `USER node`, compatible rootfs read-only (C.7), copie du manifeste en LABEL `io.gladysassistant.manifest` au build ;
- workflow GitHub Actions prêt à l'emploi : build **multi-arch `linux/amd64` + `linux/arm64` via buildx** (cf. B.14.7), push sur GHCR au tag git — un dev tiers publie sans écrire une ligne de CI ;
- `README` court : « publier son intégration en 5 étapes », renvoyant vers la doc développeur du site (B.12) pour le détail.

### B.12 Documentation : site `GladysAssistant/v4-website`

Le site public (gladysassistant.com) doit accueillir la documentation de la fonctionnalité — c'est un chantier à part entière, **dans les deux langues du site (fr + en)**, en suivant la structure et les conventions existantes du repo (l'agent qui s'en charge commence par auditer l'arborescence de la doc). Le contenu est une **transposition des sections B/C de cette spec** (qui restent la source de vérité), pas une invention. Deux livrables :

1. **Doc utilisateur : « Intégrations internes et externes, quelle différence ? »** — page dans la doc existante des intégrations : ce qu'est une intégration externe (développée par la communauté, exécutée dans un conteneur isolé, **non auditée par l'équipe Gladys**), le sens du badge « externe » et de l'écran d'avertissement, ce que la sandbox garantit (limites CPU/mémoire, pas d'accès à Docker, matériel uniquement si l'utilisateur l'accorde classe par classe — interrupteurs à l'install et dans l'écran Configuration) et ce qu'elle ne garantit pas (accès réseau sortant complet, interfaces web exposées sur le LAN si déclarées), où signaler un bug (le repo GitHub de l'intégration, pas le tracker Gladys), et les conséquences pratiques : mise à jour manuelle depuis le catalogue, désinstallation = suppression des appareils et de la config.
2. **Doc développeur : « Développer une intégration externe »** — section dédiée en deux volets :
   - *Tutoriel* (le chemin heureux, de zéro au store) : « Use this template » sur `integration-template-js` → développer en local avec le SDK hors Docker (JWT de dev, cf. B.14.2) → tester contre sa propre Gladys → pousser l'image (le workflow fourni le fait) → ajouter le topic `gladys-assistant-integration` → l'intégration apparaît dans le catalogue de toutes les Gladys à l'indexation suivante, sans approbation ;
   - *Référence* : le manifeste champ par champ avec ses règles de validation (C.1, dont cover 800×534 et bornes name/description), l'API-hôte REST (C.2–C.3), le protocole WebSocket (C.4), l'API du SDK JS (C.8), le contrat du conteneur (C.7 : rootfs read-only, `/data` seul volume, limites de ressources, variables d'environnement), les **sous-conteneurs** (déclaration `containers` = autorisation, cycle de vie via l'API `/container`, réseau privé, volumes confinés, ports publiés, classes matérielles dont le Coral — demandées par le manifeste, accordées par l'utilisateur, s'adapter via `GET /container` et `hardware-updated` —, pattern « générer la config dans `/data` puis start/restart » — avec l'exemple complet Frigate + Mosquitto), le **flow OAuth2** des services cloud (champ `oauth2`, handlers `onOAuthAuthorizeUrl`/`onOAuthCallback`) et le **statut de connexion applicatif** (`connection_status`), les bonnes pratiques réseau (pas de broadcast/mDNS entrant en bridge — unicast et cloud OK ; ne publier que les états qui changent, cf. rate-limit C.3), l'exigence multi-arch, le cycle de publication/mise à jour (bumper `version`), et le diagnostic en self-service via `rejected.json` (C.6).

### B.13 Tests (patch coverage 100 % exigé en CI)

- Superviseur : `server/test/lib/external-integration/` (un fichier par fonction), Docker mocké via `server/test/lib/system/DockerodeMock.test.js` à étendre (createNetwork, getImage().inspect avec Labels) ou fakes sinon de `gladys.system.*`.
- Contrôleurs : supertest ; API-hôte appelée avec un JWT d'intégration généré en seed (pas `authenticatedRequest`, qui est un token utilisateur). **Tests d'isolation tenant obligatoires** (token de A ≠ devices de B, préfixe `external_id` rejeté, access token utilisateur refusé sur l'API-hôte — mauvaise audience).
- Middleware : 401 (token absent/signature invalide/mauvaise audience/`token_version` obsolète/service non externe). WS : auth OK/KO, commande + ack + timeout (étendre `server/test/websockets/`).
- Store côté serveur : fetch d'index mocké (nock ou fake), cache local (hit/miss/expiration/index indisponible), filtre de compatibilité de version, détection de mise à jour, install par `store_slug` inconnu → 404, install par `repo_url` (fetch GitHub mocké : succès, repo introuvable → 404, manifeste absent/invalide → 422), et test anti-collision de routes (`GET .../store` renvoie le catalogue, pas le handler `:selector`, cf. C.5).
- Sous-conteneurs : validation du champ `containers` (bornes, noms uniques, env `GLADYS_*` interdit, volumes absolus, classes `devices` inconnues rejetées, `ports` bornés), descripteurs + réseau privé sur une fixture type Frigate + Mosquitto (DockerodeMock), `start` auto vs manual, état désiré (conteneur exité « censé tourner » → restart avec backoff ; arrêté via l'API → laissé arrêté), assignation de port hôte (libre, persisté à travers les recréations), octrois matériels (intersection demandé ∩ accordé ∩ présent, `granted_devices` hors manifeste → `422`, `POST .../:selector/hardware` → recréation + push `hardware-updated`, détection mockée présente/absente, route littérale `hardware` avant `:selector`), endpoints `/container` (liste avec `granted`/`available`, start avec `env` → recréation si diff, stop, restart, `404` sur nom inconnu, **isolation : le token de A ne pilote pas les conteneurs de B**), désinstallation complète (conteneurs + réseau privé + ports libérés + dossier data supprimés), réconciliation des orphelins au boot.
- OAuth & statut applicatif : champ `oauth2` validé dans le schéma, relais `authorize_url` (réponse via `command-result.data`, timeout, intégration déconnectée → `400`), relais `callback` (succès ; `success: false` → `422` avec le message), `connection_status` (stocké en mémoire, exposé dans le détail, push WS `connection-status-updated`, fallback de langue du message).
- Retours terrain : **upsert des `params`** sur re-publication d'un device déjà créé (params modifiés → mis à jour en DB, name/features intouchés, aucun écho `device-updated`), **actions** (`fields` validés → `422`, timeout **par action** respecté au lieu des 5 s, `404` sur `key` non déclarée, message multi-langue), **`poll` no-op silencieux** quand l'intégration est `STOPPED`/`ERROR` (zéro log, `setValue` throw toujours), nouveaux types `multi_select`/`display: "radio"` validés, avertissement double instance (même image sans tag ou même `name`), `started_at` exposé dans le détail.
- Caméra : `POST /camera/image` (image > 150 Ko → `400`, rate-limit 12/min par device → `429`, device d'une autre intégration → `404`, device sans feature caméra → `400`, `saveStringState` appelé — jamais le chemin des états), relais `camera.get-image` (image dans `command-result.data`, timeout **15 s** respecté, échec/timeout → erreur `camera.getLiveImage`).
- Indexeur (repo `integration-store`, CI propre hors monorepo) : validation de manifestes valides/invalides (dont bornes name/description), validation de covers (format/dimensions/poids, warning + placeholder si KO), **validation de la documentation** (`docs/en.md` + `docs/fr.md` présents et ≥ 300 caractères → sinon rejet `error` ; re-hébergement et URLs `docs` dans l'index), génération `index.json`/`rejected.json` déterministe sur fixtures.
- SDK (repo `integration-sdk-js`, CI propre) : tests contre un faux serveur local (endpoints C.3 mockés + WSS de test) — auth, resync à la reconnexion, ack auto (résout/throw/absent), backoff, `publishState` batch, `externalId()`.
- Template (repo `integration-template-js`, CI propre) : lint, validation du manifeste du repo contre le `manifest.schema.json` canonique (le template ne doit jamais être lui-même rejeté par l'indexeur), build Docker qui passe.
- Site (repo `v4-website`) : build du site vert, les nouvelles pages présentes dans les deux langues (fr + en).

### B.14 Risques assumés (v1)

1. **Egress réseau totalement ouvert** (choix v1) : Docker ne filtre pas par hôte de destination, et on ne prétend pas le faire — **pas de champ `permissions` dans le manifeste** : une déclaration non appliquée techniquement serait de la fausse sécurité. L'écran d'installation dit clairement que l'intégration a un accès réseau sortant complet. Le bridge dédié + `enable_icc=false` isolent uniquement les intégrations **entre elles**. Piste phase 3 : proxy sidecar ou nftables — et réintroduction d'un champ de permissions le jour où il sera réellement appliqué.
2. **Sans socket Docker** (dev, installs exotiques) : `PlatformNotCompatible` déjà levée par `system.*` → superviseur no-op + « non disponible » dans l'UI + mode dev SDK hors Docker documenté (endpoint admin pour générer un JWT d'intégration de dev).
3. **Secrets en Env** : le JWT est visible via `docker inspect` (qui suppose déjà l'accès à la socket = root de fait). Acceptable v1 : token scoppé à une seule intégration et invalidable instantanément via `token_version`.
4. **Backup/restore** : `container_id` obsolète après restore → réconciliation par label au boot ; `/data` du conteneur hors backup DB (documenter : persister l'important via `/config`).
5. **Aucune modération du store** (choix v1) : un malware avéré reste listé tant que son auteur ne retire pas le topic. Défenses réelles : sandbox stricte (B.2), avertissement affiché avant install, métadonnées GitHub visibles (stars, âge du repo). Une blocklist côté indexeur reste ajoutable plus tard sans toucher au client.
6. **Supply-chain images** (registre libre + tags mutables) : un manifeste peut référencer l'image de n'importe qui, et un tag peut être réécrit après indexation. V1 : assumé et documenté (le template recommande GHCR du même repo et l'épinglage par digest, sans l'imposer) ; durcissement (digest obligatoire, signature) en phase 3.
7. **Architectures CPU** : une grande partie du parc Gladys tourne sur Raspberry Pi (arm64) — une image amd64-only y échoue au pull ou au run. V1 : le **template builde multi-arch par défaut** (`docker buildx`, `linux/amd64` + `linux/arm64`, le workflow fourni le fait sans config) ; côté Gladys, un échec de pull/run pour architecture incompatible → statut `ERROR` avec **message explicite** dans l'UI (« image non disponible pour votre architecture »), pas une erreur Docker brute — règle valable aussi pour les images des sous-conteneurs. Piste indexeur : vérifier les plateformes du manifest list de l'image et les afficher dans le catalogue.
8. **Sous-conteneurs : ressources et surface exposée** : les limites mémoire/CPU sont déclarées par le dev (bornées par le schéma C.1, **affichées sur l'écran d'installation**) — une intégration type Frigate peut légitimement demander 1 Go et plus, c'est à l'utilisateur d'en juger avant d'installer. L'espace disque des volumes (`/data`, ex. enregistrements vidéo) n'est **pas quota-té en v1** (documenté ; pistes : quota, affichage de la taille du dossier dans le bloc de supervision). **Un port publié = une interface tierce exposée sur le LAN** (avec sa propre surface d'attaque, potentiellement non authentifiée) : déclaré dans le manifeste, affiché en clair à l'install, port hôte choisi par Gladys — c'est l'utilisateur qui accepte cette exposition, pas Gladys qui la décide. **`coral-usb` monte tout `/dev/bus/usb`** (granularité de Docker), pas seulement le Coral — dit honnêtement sur l'écran d'installation. Garde-fous : chaque classe est **accordée individuellement par l'utilisateur** (interrupteurs, révocables à tout moment — la révocation recrée le conteneur sans le périphérique), les classes sont une liste curatée (v1 : `coral-usb`, `coral-pcie`, `gpu`, `video`), extensible sans casser le schéma ; jamais de chemin `/dev` libre.

### B.15 Type « communication » : sortir Telegram & co du core (design, phase 2)

Objectif : que Telegram, Nextcloud Talk, CallMeBot — et demain Matrix, Signal, WhatsApp… — soient des intégrations externes ordinaires, et que le core cesse de les connaître par leur nom. Ce design est **phase 2** ; il est écrit dès maintenant pour que les contrats v1 n'aient rien à casser.

**État des lieux (vérifié dans le code)** — deux chemins asymétriques :
- **Entrant et réponses : déjà génériques.** Un service émet `EVENTS.MESSAGE.NEW` avec `{ source: '<nom du service>', source_user_id: '<id de chat>', user_id, user, language, text, id, created_at }` (`telegram/lib/message.new.js`) ; le cerveau répond via `message.reply`, qui fait `service.getService(originalMessage.source).message.send(source_user_id, message)` (`message.reply.js:116`) — n'importe quel service du stateManager qui expose `message.send` reçoit ses réponses sans modification du core.
- **Sortant (`sendToUser` et le cas `source: 'AI'` de `reply`) : codé en dur.** `message.sendToUser.js:37-65` énumère nominativement telegram (colonne `t_user.telegram_user_id`), nextcloud-talk (variable par user `NEXTCLOUD_TALK_TOKEN`) et callmebot — trois mécanismes d'identité ad hoc. C'est ce bloc qui interdit tout nouveau canal sans toucher au core.

**1. Refactor core (préalable, bénéfique même sans intégrations externes)** : remplacer les blocs codés en dur par une boucle générique — pour chaque service du stateManager exposant `message.sendToUser(user, message)`, l'appeler ; chaque service résout lui-même son identité par user et no-op si l'utilisateur n'est pas lié. Telegram/nextcloud-talk/callmebot implémentent cette interface (leur logique actuelle déménage du core vers leur service), la liste `TOOL_CALL_EXTERNAL_SOURCES` de `message.reply.js` devient « tout service exposant `message.sendToUser` », et le core ne connaît plus aucun nom.

**2. Côté intégration externe** — extension naturelle des contrats v1 :
- **Manifeste** : `type: "communication"` (le champ `type` de C.1 est prévu pour) ; pas d'écrans Appareils/Découverte — la page générique n'affiche que Configuration (elle branche déjà par type).
- **Proxy-service** : expose `message.send(contactId, message)` (chemin réponse, déjà générique) et `message.sendToUser(user, message)` (boucle du refactor ci-dessus, résolution d'identité par le superviseur — voir liaison) ; les deux relaient par WS `external-integration.message.send { message_id, contact_id, message: { text, file } }` avec l'ack `command-result` standard (la convention `<domaine>.<action>` de C.4 était prévue pour).
- **Entrant** : `POST /api/integration/v1/message` `{ "contact_id": "...", "text": "...", "created_at"? }` — le superviseur résout `contact_id → user` via la table de liaison, puis émet `EVENTS.MESSAGE.NEW` avec `source = <selector>` : cerveau, réponse et historique fonctionnent tels quels. Contact inconnu → `404` (l'intégration peut alors répondre dans le canal « compte non lié, code requis »).
- **Liaison utilisateur↔contact, générique et dans l'UI de Gladys** (généralisation du deep-link Telegram existant, `message.getCustomLink.js`) : l'utilisateur clique « Lier mon compte » sur la page de l'intégration → Gladys génère un code court en cache (TTL 15 min, lié au `user_id`) → l'utilisateur envoie ce code au bot dans le canal externe → l'intégration appelle `POST /api/integration/v1/contact/link { code, contact_id, contact_name? }` → le superviseur valide et persiste la liaison → `200 { user: { selector, first_name, language } }`. Stockage : `t_variable` scoppée `(service_id, user_id)` (le pattern nextcloud-talk existant — aucune migration) ; `GET /contact` liste les contacts liés ; révocation par l'utilisateur depuis la page de l'intégration (chaque user voit et délie **son** compte).

**3. Risque spécifique, à traiter à la hauteur du danger** : un message entrant a l'**autorité de l'utilisateur lié** (déclencher des scènes, ouvrir des portes via le cerveau…). La liaison par code est donc le consentement critique : code à usage unique, TTL court, généré seulement par l'utilisateur depuis l'UI, révocable ; et l'écran d'installation d'une intégration `communication` avertit spécifiquement (« cette intégration pourra envoyer et recevoir des messages en votre nom »). Même modèle de confiance que le bot Telegram actuel — mais avec du code non audité : à écrire noir sur blanc dans la doc utilisateur (B.12).

**Ce que la v1 doit anticiper (et anticipe déjà)** : `type` extensible dans le manifeste et le filtre catalogue ; page générique branchée par type ; convention WS `<domaine>.<action>` ; proxy-service extensible par capacité (`device.*` aujourd'hui, `message.*` demain) ; variables scoppées `(service_id, user_id)` disponibles. Seul travail v1 : ne pas fermer ces portes. Phase 3 : dépréciation des services communication du core au profit d'équivalents externes maintenus par la communauté.

### B.16 Découverte réseau médiée (design, phase 2)

Problème (établi en B.2) : les conteneurs bridge ne reçoivent **jamais** les broadcasts, mDNS ou SSDP du LAN — seul le core, en `network=host`, les voit. Cas de validation concret : le scan local Tuya (`tuya.localScan.js`) écoute des broadcasts UDP sur les ports 6666/6667/7000 puis parse/déchiffre les paquets avec la lib tuyapi. Principe du design : **le core capture (position réseau), l'intégration interprète (connaissance du protocole)** — le core ne parse jamais rien.

**Déclaration dans le manifeste** (même philosophie que `containers`/`devices` : demander = montrer à l'utilisateur) — champ optionnel `network_discovery`, liste de captures **curatées** :

```json
"network_discovery": [
  { "type": "udp-broadcast", "ports": [6666, 6667, 7000] },
  { "type": "mdns", "service": "_hue._tcp" }
]
```

Types v1 du champ (extensibles par version de schéma) : `udp-broadcast` (écoute passive sur les ports déclarés, max 5 ports), `mdns` (browse d'un type de service déclaré), `ssdp` (M-SEARCH sur un `st` déclaré). Affiché sur l'écran d'installation (« cette intégration pourra écouter les annonces réseau UDP ports 6666–6667 ») ; jamais de capture arbitraire (pas de pcap, pas de port non déclaré).

**API-hôte (phase 2)** — scan à la demande, synchrone et borné :
- `POST /api/integration/v1/network_discovery/scan` `{ "type": "udp-broadcast", "timeout_seconds": 10 }` (1–30 s, `403` si le type/les ports ne sont pas déclarés dans le manifeste) → `200` avec les résultats **bruts** : `udp-broadcast` → `[ { "source_ip", "source_port", "payload_base64" } ]` ; `mdns` → `[ { "name", "host", "addresses", "port", "txt" } ]` ; `ssdp` → en-têtes bruts par répondeur.
- L'intégration parse elle-même (Tuya : `MessageParser` sur les `payload_base64`, exactement le code de `localScan` actuel), puis joint les appareils en **unicast** (qui traverse le NAT, déjà possible en v1) et publie ses `discovered_device`.

Côté core : `server/lib/external-integration/networkDiscovery/` — sockets ouvertes seulement pendant un scan (coût borné par le timeout), un scan concurrent par intégration, réutilise la position `network=host` (et le savoir-faire lan-manager pour un éventuel type `ip-scan` ultérieur).

**Ce que la v1 doit anticiper (et anticipe déjà)** : champ de manifeste additif (un manifeste avec `network_discovery` est simplement refusé par une Gladys trop vieille via `gladys_version`), API-hôte versionnée, écran d'installation déjà structuré en « demandes » approuvées (conteneurs, matériel — les captures s'y rangeront). En attendant : Tuya externe = cloud + poll local unicast (IPs obtenues du cloud), sans scan LAN — documenté honnêtement (B.2, B.12).

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
| `containers` | array | non | **sous-conteneurs** additionnels, max 5 (voir ci-dessous) |
| `actions` | array | non | **actions à la demande** affichées dans l'écran Configuration, max 10 (voir ci-dessous) |

Pas de champ `permissions` en v1 : l'accès réseau sortant est ouvert et l'écran d'installation le dit — on ne spécifie pas ce qu'on ne sait pas appliquer (cf. B.14). Le champ pourra apparaître dans une future `manifest_version` quand une restriction réelle existera.

**Cover re-hébergée par l'indexeur** : à chaque crawl, l'indexeur télécharge la `cover_image`, la valide (magic bytes JPEG/PNG, 800×534, ≤ 150 Ko) et publie une copie sur GitHub Pages ; c'est **cette URL-là** que l'index référence (`cover_url`, cf. C.6). Trois bénéfices : pas de lien mort dans le catalogue, pas de fuite d'IP des utilisateurs vers un serveur tiers à chaque affichage du catalogue, et poids/format garantis. Une cover absente ou invalide ne rejette pas l'intégration : elle est indexée avec un placeholder, et un avertissement (`level: "warning"`) est publié dans `rejected.json`.

**Fallback de langue** (tous les champs multi-langues : `description` du manifeste, `label`/`description`/`placeholder`/`options[].label` du `config_schema`) : le front affiche la langue de l'utilisateur si présente, sinon `en` (obligatoire partout, donc toujours disponible).

**`config_schema`** : volontairement une liste plate de champs, pas du JSON Schema complet — le rendu du formulaire reste déterministe et sans surprise (principe « UI déclarative »). Champs par entrée : `key` (unique, `[a-z0-9_]`), `type` (`string` | `number` | `boolean` | `select` | `multi_select` | `secret` | `oauth2`), `label` (multi-langue, `en` obligatoire), `description` (multi-langue, optionnel), `placeholder` (multi-langue, optionnel — texte d'exemple affiché dans le champ vide, ex. `48.85`), `required` (défaut `false`), `default`, `min`/`max` (number), `options` (select/multi_select : `[{ value, label }]`), `display` (select : `"dropdown"` défaut ou `"radio"` — boutons radio). Rendus : `boolean` = interrupteur/case à cocher ; `multi_select` = cases à cocher, valeur stockée = array de `value`s. Les valeurs sont stockées dans `t_variable` scoppées par `service_id` ; les `secret` ne sont **jamais renvoyés au front** (cf. C.5), mais sont fournis à l'intégration.

**Type `oauth2`** (services cloud à autorisation navigateur — le cas Netatmo, vérifié dans `netatmo.retrieveTokens.js` : c'est le front qui porte le flow). Rendu : un bouton « Connecter » (+ l'état de connexion, cf. `connection_status` C.3). Flow, entièrement relayé — **le serveur Gladys ne connaît aucun provider** :
1. clic sur « Connecter » → `POST .../:selector/oauth/authorize_url { key, redirect_uri }` (C.5), relayé à l'intégration par WS (`oauth.get-authorize-url`, C.4) — c'est **elle** qui construit l'URL (client_id de sa config, scopes, `state` anti-CSRF qu'elle génère et retient) ;
2. le front ouvre l'URL (popup), l'utilisateur consent chez le provider, qui redirige vers la **route de callback générique** de la page front (`.../oauth-callback?code&state`) ;
3. le front relaie `POST .../:selector/oauth/callback { key, code, state, redirect_uri }` (C.5) → WS `oauth.callback` → l'intégration vérifie `state`, échange le code contre les tokens, les stocke en config **hors schéma** (`POST /config`) et met à jour son `connection_status`.

Les tokens ne transitent jamais par le front, et le refresh est l'affaire de l'intégration (comme `netatmo.refreshingTokens` aujourd'hui).

**`containers`** : le **contrat d'autorisation** des sous-conteneurs (B.2) — déclare ce qui peut tourner ; le cycle de vie se pilote ensuite via l'API `/container` (C.3), uniquement dans ces bornes. Exemple (intégration Frigate) :

```json
"containers": [
  {
    "name": "mqtt",
    "docker_image": "eclipse-mosquitto:2.0.18",
    "start": "manual",
    "volumes": ["/mosquitto/config", "/mosquitto/data"],
    "memory_mb": 128
  },
  {
    "name": "frigate",
    "docker_image": "ghcr.io/blakeblackshear/frigate:0.14.1",
    "start": "manual",
    "volumes": ["/config", "/media/frigate"],
    "read_only": false,
    "memory_mb": 1024,
    "shm_mb": 128,
    "ports": [{ "container_port": 5000, "label": { "en": "Frigate UI", "fr": "Interface Frigate" } }],
    "devices": ["coral-usb"]
  }
]
```

Champs par entrée (validés par l'indexeur **et** le serveur, tous affichés sur l'écran d'installation) :
- `name` (obligatoire) : `[a-z0-9-]{2,20}`, unique dans le manifeste — sert d'alias DNS sur le réseau privé, de suffixe du nom de conteneur et d'identifiant dans l'API `/container` ;
- `docker_image` (obligatoire) : mêmes règles que l'image principale (registre public, tag ou digest, multi-arch recommandé) ;
- `start` : `"auto"` (défaut : démarré par le superviseur avant le principal) ou `"manual"` (démarré par l'intégration via l'API, cf. B.2) ;
- `env` : objet `{ clé: valeur }` de **strings statiques** ; clés `GLADYS_*` interdites ; le manifeste est public → **jamais de secret ici** (les credentials se génèrent au runtime et passent par les fichiers de `/data` ou par l'`env` du `POST /container/:name/start`, cf. B.2/C.3) ;
- `volumes` : chemins **absolus** dans le conteneur, max 5 — chacun monté depuis un sous-dossier dérivé du dossier de l'intégration (C.7), le manifeste ne choisit jamais de chemin hôte ;
- `ports` : max 3 entrées `{ container_port, protocol ("tcp" défaut), label (multi-langue, en obligatoire) }` — le port **hôte** est choisi par Gladys (libre, persisté), jamais déclaré (C.7) ; le `label` nomme le lien « Ouvrir » dans l'UI ;
- `devices` : classes d'accès matériel **demandées**, parmi `coral-usb` | `coral-pcie` | `gpu` | `video` (liste v1, extensible par version de schéma — jamais de chemin `/dev` libre) ; demander n'est pas obtenir : chaque classe est **accordée ou refusée par l'utilisateur** dans l'UI (B.2), le montage effectif = demandé ∩ accordé ∩ présent ;
- `read_only` : défaut `true` ; opt-out possible (certaines images amont, ex. Frigate, ne tournent pas en rootfs read-only) ;
- `memory_mb` : 32–4096, défaut 256 ; `cpu` : 0.1–2, défaut 0.5 ; `shm_mb` : 64–512, défaut 64 (`/dev/shm`, utile aux traitements vidéo) ;
- `command` : optionnel, array (override du CMD de l'image).

**`actions`** : le besoin générique « exécute cette opération et montre-moi le résultat » sans UI custom — test de connexion, identify, ré-appairage, détection de version de protocole… Rendues comme des **boutons dans l'écran Configuration** (B.8). Exemple (le cas Tuya : détecter version de protocole et data points d'un appareil dont l'IP est saisie à la main quand le scan UDP ne l'a pas trouvée — opération longue, ~15 s) :

```json
"actions": [
  {
    "key": "detect_protocol",
    "label": { "en": "Detect protocol version", "fr": "Détecter la version de protocole" },
    "description": { "en": "Tries each protocol version against the device.", "fr": "Essaie chaque version de protocole sur l'appareil." },
    "timeout_seconds": 30,
    "fields": [
      { "key": "ip", "type": "string", "label": { "en": "Device IP", "fr": "IP de l'appareil" }, "required": true, "placeholder": { "en": "192.168.1.42" } }
    ]
  }
]
```

Règles : `key` unique `[a-z0-9_]` ; `label` multi-langue (`en` obligatoire), `description` optionnelle ; `fields` optionnel = **même format que le `config_schema`** (le mini-formulaire est rendu par le même moteur, validé pareil) ; `timeout_seconds` 5–120, défaut 30 — c'est le délai d'ack accordé à `action.run` (C.4), **exception à la règle des 5 s**, car ces opérations peuvent être longues. Exécution : bouton (± formulaire) → `POST .../:selector/action/:key` (C.5) → relais WS → le résultat (`data.message`, string ou multi-langue) s'affiche sous le bouton, succès ou échec.

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

**`POST /api/integration/v1/connection_status`** — corps `{ "connected": false, "message": { "en": "Token expired, please reconnect.", "fr": "Token expiré, reconnectez-vous." } }` (`message` optionnel, multi-langue avec fallback `en`) → `200 { "success": true }`. **Statut applicatif** de l'intégration (« connecté à Netatmo », « token expiré »…), tenu en mémoire par le superviseur, exposé dans le détail (C.5), affiché dans l'écran Configuration et poussé au front (`connection-status-updated`, C.4). Distinct de la machine à états conteneur (B.2) : une intégration cloud peut être `RUNNING` (conteneur sain, WS connecté) et pourtant déconnectée de son service tiers — sans ce canal, elle serait cassée en silence.

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

**Re-publication d'un device déjà créé** (même `external_id`) : les `params` sont la **donnée technique de l'intégration** — le superviseur les compare à ceux en DB et les **upsert silencieusement** (ajout/mise à jour par `name`) : une IP LAN qui change en DHCP, un passage cloud→local après un scan, sans supprimer/recréer l'appareil. Le `name`, la pièce et les features restent intouchés (propriété de l'utilisateur), et il n'y a **pas d'écho `device-updated`** vers l'intégration (c'est sa propre publication — sinon boucle). Si la **structure** publiée diffère (features ajoutées/modifiées), l'écran Découverte propose « Mettre à jour » (B.8) : un geste utilisateur, via le `POST /api/v1/device` standard.

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
→ `200 { "success": true }`. `state` numérique **ou** `text` string ; `created_at` optionnel pour un état passé. Max 100 états/requête ; **rate-limit : 300 états/minute par intégration**, `429 TOO_MANY_REQUESTS` au-delà (anti-spam SQLite/DuckDB). Le seuil est dimensionné pour des **changements d'état**, pas des instantanés complets : une intégration qui polle une grosse flotte (ex. 50 appareils Tuya × 6 features) doit **dédupliquer** et ne publier que ce qui a changé — bonne pratique à écrire dans la doc développeur (B.12). Un `device_feature_external_id` inconnu est ignoré silencieusement (comportement standard de `newStateEvent` : l'utilisateur n'a pas créé ce device).

**`POST /api/integration/v1/camera/image`** — corps `{ "device_external_id": "ext:tuya-demo:cam", "image": "image/jpg;base64,/9j/4AAQ..." }` → `200 { "success": true }`. Publie la **nouvelle image d'une caméra** : device de l'intégration portant une feature `camera`/`image` (`DEVICE_FEATURE_CATEGORIES.CAMERA` + `DEVICE_FEATURE_TYPES.CAMERA.IMAGE`, déclarée comme n'importe quelle feature dans `discovered_device`), mappé sur `gladys.device.camera.setImage` — même format que les services caméra internes (`image/jpg;base64,<données>`, cf. `rtsp-camera/lib/getImage.js:95`), le widget caméra du dashboard se met à jour en temps réel. Limites : **≤ 150 Ko** (la borne du core, `camera.setImage.js`), **12 images/minute par device** (une toutes les 5 s — le flux vidéo continu n'est pas le périmètre v1, cf. `camera.start-streaming` phase 2), `404` si le device n'appartient pas à l'intégration, `400` s'il n'a pas de feature caméra. Les images ne passent **jamais** par `POST /state` : chemin `saveStringState` dédié, hors historique d'états et hors rate-limit des états.

**`GET /api/integration/v1/config`** → `200 { "config": { "latitude": 48.85, "unit": "celsius", "api_key": "s3cr3t" } }` — toutes les valeurs, secrets inclus (c'est l'intégration, pas le front).

**`POST /api/integration/v1/config`** — corps `{ "config": { "<key>": <value> } }`, merge partiel → `200 { "success": true }`. Les clés présentes dans le `config_schema` sont validées contre lui ; les clés hors schéma sont un **stockage interne libre** de l'intégration (état d'appairage, tokens tiers…), jamais affichées dans l'UI.

**Cycle de vie des sous-conteneurs** — toutes ces routes ne connaissent que les entrées `containers[]` du manifeste de **cette** intégration (le JWT fait périmètre, comme partout) : `404 NOT_FOUND` pour tout autre `:name`. Aucune route ne permet de créer un conteneur non déclaré. Aucun de ces gestes volontaires n'incrémente `failure_count`.

**`GET /api/integration/v1/container`** → `200`
```json
{
  "containers": [
    { "name": "mqtt", "status": "running", "desired": "running", "started_at": "2026-07-13T08:00:00.000Z", "ports": [] },
    { "name": "frigate", "status": "stopped", "desired": "stopped", "started_at": null,
      "ports": [{ "container_port": 5000, "host_port": 42115 }],
      "devices": [{ "class": "coral-usb", "granted": true, "available": true }] }
  ]
}
```
— les sous-conteneurs déclarés, leur état Docker, l'état désiré (B.2), les ports hôte assignés et, par classe matérielle demandée, l'état accordé/disponible (c'est ainsi que l'intégration sait quoi mettre dans sa config — ex. détecteur `edgetpu` vs `cpu` pour Frigate) ; liste vide si l'intégration n'en déclare pas.

**`POST /api/integration/v1/container/:name/start`** — corps `{}` ou `{ "env": { "MQTT_PASSWORD": "..." } }` → `200 { "success": true }`. Crée le conteneur s'il n'existe pas encore, puis le démarre ; il entre dans l'état désiré « running » (redémarré par le superviseur s'il crash). L'`env` fourni est fusionné **au-dessus** des `env` du manifeste (clés `GLADYS_*` interdites → `400`) — c'est le canal pour des valeurs calculées au runtime ; si l'`env` diffère de celui du conteneur existant, le superviseur le **recrée** (destroy + create, les volumes `/data` persistent) avant de le démarrer.

**`POST /api/integration/v1/container/:name/stop`** — corps `{}` → `200 { "success": true }`. Arrête le conteneur et le sort de l'état désiré : le superviseur ne le redémarrera pas.

**`POST /api/integration/v1/container/:name/restart`** — corps `{}` → `200 { "success": true }`. Usage type : l'intégration a réécrit un fichier de config du sous-conteneur via `/data` (cf. B.2) et le redémarre pour l'appliquer.

### C.4 WebSocket intégration : protocole

Connexion : même hôte/port que l'API-hôte (`ws://<gateway>:<port>/`, même serveur HTTP). Non authentifié après 5 s → connexion terminée (comportement existant).

| Sens | `type` | `payload` |
|---|---|---|
| intégration → core | `authenticate.integration-request` | `{ "token": "<JWT>" }` — **premier message obligatoire** |
| core → intégration | `authentication.connected` | `{}` (réutilisé tel quel ; échec = close code `4000` `INVALID_ACCESS_TOKEN`) |
| core → intégration | `external-integration.device.set-value` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" }, "device_feature": { "external_id", "category", "type" }, "value": 1 }` |
| core → intégration | `external-integration.device.poll` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" } }` — demande de relève pour un device à `poll_frequency` ; les états remontent par `POST /state` |
| core → intégration | `external-integration.camera.get-image` | `{ "message_id": "uuid", "device": { "external_id", "selector", "params" } }` — demande d'image **fraîche** (vue live du dashboard, intent chat « montre-moi la caméra » : `camera.getLiveImage` → `device.getImage` du proxy-service) ; répondre par `command-result` avec `data: { "image": "image/jpg;base64,..." }` (≤ 150 Ko) ; ack attendu sous **15 s** (capture ffmpeg possible), pas 5 s |
| intégration → core | `external-integration.command-result` | `{ "message_id": "uuid", "success": true, "data": { ... } }` ou `{ "message_id": "uuid", "success": false, "error": "..." }` — ack de **toute** commande porteuse d'un `message_id`, attendu sous **5 s**, sinon la commande échoue côté core ; `data` est **optionnel**, pour les commandes qui attendent une réponse (ex. `oauth.get-authorize-url` ; demain `camera.get-image`) |
| core → intégration | `external-integration.scan-request` | `{}` — l'intégration répond en republiant `POST /discovered_device` |
| core → intégration | `external-integration.device-created` / `.device-updated` / `.device-deleted` | `{ "device": <device standard> }` (relais des hooks `postCreate`/`postUpdate`/`postDelete`) |
| core → intégration | `external-integration.config-updated` | `{ "config": { ... } }` — nouvelles valeurs complètes (pas besoin de re-fetch) |
| core → intégration | `external-integration.hardware-updated` | `{ "containers": [ { "name", "devices": [{ "class", "granted", "available" }] } ] }` — l'utilisateur a modifié les octrois matériels (B.2) ; les sous-conteneurs concernés ont été recréés, à l'intégration de régénérer ses configs et de (re)démarrer ce qu'il faut |
| core → intégration | `external-integration.oauth.get-authorize-url` | `{ "message_id": "uuid", "key": "netatmo_account", "redirect_uri": "https://..." }` — l'utilisateur a cliqué « Connecter » sur un champ `oauth2` (C.1) ; répondre par `command-result` avec `data: { "authorize_url": "https://..." }` |
| core → intégration | `external-integration.oauth.callback` | `{ "message_id": "uuid", "key": "netatmo_account", "code": "...", "state": "...", "redirect_uri": "https://..." }` — retour du provider ; l'intégration vérifie `state`, échange les tokens, les stocke (`POST /config` hors schéma) et ack |
| core → intégration | `external-integration.action.run` | `{ "message_id": "uuid", "key": "detect_protocol", "fields": { "ip": "192.168.1.42" } }` — l'utilisateur a cliqué un bouton d'action (C.1) ; répondre par `command-result` avec `data: { "message": "..." }` (string ou multi-langue) ; l'ack est attendu sous le **`timeout_seconds` déclaré de l'action** (pas 5 s) |
| intégration → core | `external-integration.heartbeat` | `{}` — applicatif, optionnel si la lib WS répond aux pings protocole |

Convention de nommage des commandes : **un type spécifique par action**, `external-integration.<domaine>.<action>` — pas de type générique avec champ `action`. Les commandes futures (phase 2 : `message.send` pour le type « communication » (B.15), `camera.start-streaming` pour le flux vidéo continu… selon les types d'intégrations ajoutés) suivront ce schéma, chacune avec `message_id` + ack `command-result` ; une intégration ignore silencieusement un type qu'elle ne connaît pas.

Règles de fiabilité du protocole :
- **Pas de file d'attente** : les messages core→intégration (`device-created/updated/deleted`, `config-updated`, `scan-request`) émis pendant une déconnexion sont **perdus**. Contrat : à chaque (re)connexion, l'intégration refait `GET /device` et `GET /config` pour resynchroniser son état — le SDK le fait automatiquement.
- **Pas d'écho de config** : `config-updated` n'est poussé que pour les changements venant du front ; un `POST /config` de l'intégration elle-même ne déclenche jamais de `config-updated` en retour (sinon boucle).
- **`command-result` avec `success: false`** : traité côté core exactement comme un timeout — throw (`ExternalIntegrationUnavailableError` ou message d'erreur relayé), erreur visible dans l'UI device.

Santé : le core envoie un **ping WebSocket protocolaire** toutes les 20 s ; toute lib WS standard y répond automatiquement (pong). 2 pongs manqués ou socket fermée → statut `DEGRADED`. Une reconnexion remplace l'ancienne connexion enregistrée.

Messages core → front (UI temps réel, sur le WS utilisateur existant) : `external-integration.status-changed` `{ "selector", "status" }`, `external-integration.discovered-devices-updated` `{ "selector" }` et `external-integration.connection-status-updated` `{ "selector", "connected", "message" }` (cf. C.3).

### C.5 API de gestion (front ↔ serveur)

Routes `/api/v1/external_integration`, auth utilisateur Gladys standard ; **admin** requis pour tout ce qui modifie.

⚠️ **Collision routes littérales vs `:selector`** : les routes sont enregistrées dans Express dans l'ordre de déclaration de l'objet `routes.js` (`setupRoutes.js` itère `Object.keys`). Les routes littérales `store`, `store/refresh` et `hardware` doivent donc être déclarées **avant** `:selector` — précédent existant dans le code : `get /api/v1/device/duckdb_migration_state` déclaré avant `get /api/v1/device/:device_selector`. Double protection : les selectors d'intégrations sont préfixés `ext-` (B.1), `store` ou `hardware` ne peuvent donc jamais être des selectors valides ; et un test dédié vérifie que `GET .../store` renvoie le catalogue (pas le handler détail), pour casser la CI si quelqu'un réordonne les routes.

| Méthode & route | Corps → Réponse |
|---|---|
| `GET /api/v1/external_integration` | → `[ { "id", "name", "selector", "status", "version", "docker_image", "store_slug", "manifest", "update_available" } ]` |
| `GET .../:selector` | → détail (mêmes champs, + `"started_at"` du conteneur principal, + `"connection_status": { "connected", "message" }` (C.3), + `"containers": [ { "name", "status", "started_at", "ports": [{ "container_port", "host_port", "label" }] } ]` pour les multi-conteneurs — le front en tire les liens « Ouvrir ») |
| `GET /api/v1/external_integration/store` | → `{ "refreshed_at", "integrations": [ { "store_slug", "manifest": <manifeste>, "github": { "stars", "pushed_at" }, "installed": false, "update_available": false, "compatible": true } ] }` (filtré par `gladys_version`) |
| `POST .../store/refresh` *(admin)* | `{}` → index re-téléchargé, même réponse que `GET .../store` |
| `GET /api/v1/external_integration/hardware` | → `{ "classes": [ { "class": "coral-usb", "detected": true }, { "class": "gpu", "detected": false }, ... ] }` — détection sur l'hôte (`system.detectHardwareClasses()`, cf. B.2) ; alimente les interrupteurs de l'écran d'installation |
| `POST /api/v1/external_integration` *(admin)* | `{ "store_slug": "john/gladys-open-meteo-demo" }` **ou** `{ "repo_url": "https://github.com/john/gladys-open-meteo-demo" }` **ou** `{ "docker_image": "...", "manifest": {...} }` (mode dev) ; + optionnel `"granted_devices": ["coral-usb"]` (les interrupteurs de l'écran d'installation ; classes non demandées par le manifeste → `422`) → `201` détail ; `repo_url` : `422` si manifeste absent/invalide dans le repo, `404` si repo introuvable |
| `POST .../:selector/start` / `stop` / `restart` / `update` *(admin)* | `{}` → `200` détail (statut à jour) |
| `POST .../:selector/hardware` *(admin)* | `{ "granted_devices": ["coral-usb", "gpu"] }` (liste complète accordée, remplace la précédente ; classes non demandées → `422`) → `200` détail — recrée les sous-conteneurs concernés + push `hardware-updated` à l'intégration (B.2) |
| `GET .../:selector/logs?lines=200&container=frigate` *(admin)* | → `{ "logs": "<stdout/stderr bruts via docker logs>" }` ; `container` optionnel (défaut : le conteneur principal), `404` si non déclaré |
| `GET .../:selector/discovered_device` | → `[ { ...device découvert, "created": false } ]` (flag = un device avec ce `external_id` existe déjà) |
| `POST .../:selector/scan` | `{}` → `200 { "success": true }` (relaie `scan-request` ; `400` si intégration déconnectée) |
| `GET .../:selector/config` | → `{ "config": { "latitude": 48.85, "api_key": null }, "configured_secrets": ["api_key"] }` — les `secret` sont toujours `null`, le flag dit s'ils sont renseignés |
| `POST .../:selector/config` *(admin)* | `{ "config": {...} }` validé contre le `config_schema` (`422` sinon) → `200` + push `config-updated` à l'intégration ; un `secret` à `null` = inchangé |
| `POST .../:selector/oauth/authorize_url` *(admin)* | `{ "key", "redirect_uri" }` → `200 { "authorize_url": "https://..." }` — relais WS `oauth.get-authorize-url` (C.4, réponse via `command-result.data`) ; `400` si le champ n'est pas de type `oauth2` ou si l'intégration est déconnectée |
| `POST .../:selector/oauth/callback` *(admin)* | `{ "key", "code", "state", "redirect_uri" }` → `200 { "success": true }` — relais WS `oauth.callback` ; un échec côté intégration (`success: false`) remonte en `422` avec son message |
| `POST .../:selector/action/:key` *(admin)* | `{ "fields": {...} }` validé contre les `fields` de l'action (`422` sinon) → `200 { "success": true, "message": ... }` — relais WS `action.run`, attente = `timeout_seconds` de l'action ; `success: false` → `422` avec le message ; `404` si `:key` non déclarée ; `400` si intégration déconnectée |
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
      "docs": {
        "en": "https://<pages-du-store>/docs/john--gladys-open-meteo-demo/en.md",
        "fr": "https://<pages-du-store>/docs/john--gladys-open-meteo-demo/fr.md"
      },
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

**Ce qui n'est jamais accordé, à aucun conteneur** : pas de `Privileged`, pas de montage de la socket Docker (les conteneurs additionnels passent par la déclaration `containers` + l'API `/container`), pas de `NetworkMode: host`. Le conteneur **principal** n'a en outre ni ports publiés ni périphériques (`ExposedPorts`/`PortBindings`/`Devices` vides — son canal entrant, c'est le WS sortant) : les ports et le matériel n'existent que sur les **sous-conteneurs**, uniquement déclarés dans le manifeste et approuvés à l'installation.

**Sous-conteneurs : descripteur.** Chaque entrée `containers[]` du manifeste (C.1) produit un conteneur `gladys-<selector>-<name>` avec le **même verrouillage** que le principal (`CapDrop ALL`, `no-new-privileges`, `RestartPolicy no`, `PidsLimit 100`, `LogConfig` borné, tmpfs `/tmp`), aux différences près :

| Aspect | Sous-conteneur |
|---|---|
| Réseau | **uniquement** le bridge privé `gladys-int-<selector>` (icc actif, alias DNS = `name`) ; jamais `gladys-integrations` → aucun accès à l'API-hôte |
| Env | les `env` statiques du manifeste, surchargés par l'`env` du `POST /container/:name/start` (C.3), + `TZ` ; **aucune** variable `GLADYS_*` (pas de token — un sous-conteneur n'a pas d'identité Gladys) |
| Volumes | chaque entrée `volumes[]` → bind `<basePath>/external-integrations/<selector>/containers/<name><chemin>` — chemin hôte **dérivé par le superviseur**, jamais fourni par le manifeste ; le conteneur principal les voit sous son `/data/containers/<name>/...` |
| Ports | `PortBindings` uniquement pour les `ports[]` déclarés — port hôte **choisi par Gladys** (libre au premier démarrage, puis persisté), bind `0.0.0.0` (accès LAN assumé et affiché à l'install, cf. B.14.8) |
| Périphériques | `Devices` = intersection **demandé (manifeste) ∩ accordé (`granted_devices`, interrupteurs de l'UI) ∩ présent (détection)** — classes résolues par le superviseur : `coral-usb` → `/dev/bus/usb`, `coral-pcie` → `/dev/apex_*`, `gpu` → `/dev/dri`, `video` → `/dev/video*` ; recalculée à chaque création de conteneur |
| Rootfs | `ReadonlyRootfs` selon `read_only` du manifeste (défaut `true`) |
| Limites | `Memory`/`MemorySwap` = `memory_mb` (défaut 256), `NanoCpus` = `cpu` (défaut 0,5), `ShmSize` = `shm_mb` (défaut 64) — valeurs du manifeste, affichées à l'install |
| Labels | `io.gladysassistant.external-integration: <selector>` (même clé de réconciliation que le principal — un seul filtre attrape tout le groupe) + `io.gladysassistant.container: <name>` |

Le réseau privé `gladys-int-<selector>` est créé à l'install et porte le même label — la désinstallation et la réconciliation au boot suppriment conteneurs **et** réseau par le même filtre.

**Variables d'environnement injectées** (contrat complet — rien d'autre n'est passé) :

| Variable | Exemple | Rôle |
|---|---|---|
| `GLADYS_HOST_API_URL` | `http://172.30.0.1:80` | base de l'API-hôte (C.2), sans slash final ; l'URL WS s'en déduit (`http→ws`, même hôte/port). **Valeur nominale : `http://172.30.0.1:80`** — gateway du bridge épinglée par IPAM + `SERVER_PORT` (80 sur l'install standard). Cas dégradés : subnet occupé → gateway auto-assignée lue via `inspectNetwork` ; Gladys en bridge → alias DNS `http://gladys:<port>` (B.2 réseau). **L'intégration doit toujours lire la variable**, jamais coder l'URL en dur — c'est la variable qui fait contrat, sa valeur n'est prévisible que pour le débogage |
| `GLADYS_INTEGRATION_TOKEN` | JWT | auth REST (`Authorization: Bearer`) et WS (`authenticate.integration-request`) ; régénéré à **chaque recréation** du conteneur (`token_version++`, B.3) |
| `GLADYS_INTEGRATION_SELECTOR` | `ext-john-gladys-open-meteo-demo` | selector de l'intégration, pour construire les `external_id` (`ext:<selector>:...`) |
| `TZ` | `Europe/Paris` | timezone configurée dans Gladys (variable système `TIMEZONE`), pour des logs et des crons cohérents |

Recréation de conteneur (update, régénération de token, changement de descripteur) = destroy + create avec les mêmes `Binds` : `/data` est la seule mémoire persistante du conteneur, tout le reste est jetable par design.

### C.8 SDK JS : API publique de `@gladysassistant/integration-sdk`

Exemple complet (la demo tient en ~40 lignes) :

```js
const { GladysIntegration } = require('@gladysassistant/integration-sdk');

// Toutes les options sont lues depuis les env vars du conteneur (C.7) par défaut ;
// on peut les surcharger pour le dev hors Docker.
const gladys = new GladysIntegration();

gladys.onScanRequest(async () => {
  await gladys.publishDiscoveredDevices([
    {
      name: 'Interrupteur virtuel',
      external_id: gladys.externalId('switch'),
      features: [
        {
          name: 'On/Off',
          external_id: gladys.externalId('switch:binary'),
          category: 'switch',
          type: 'binary',
          min: 0,
          max: 1,
          read_only: false,
          has_feedback: true,
          keep_history: true
        }
      ]
    }
  ]);
});

gladys.onSetValue(async (device, feature, value) => {
  // résoudre = ack success:true ; throw = ack success:false + message
  await gladys.publishState(feature.external_id, value);
});

gladys.onConfigUpdated(async (config) => {
  console.log('Nouvelle config', config); // stdout → docker logs
});

await gladys.connect(); // résout une fois authentifié
```

**Constructeur** — `new GladysIntegration(options?)` : `hostApiUrl` (défaut `GLADYS_HOST_API_URL`), `token` (défaut `GLADYS_INTEGRATION_TOKEN`), `selector` (défaut `GLADYS_INTEGRATION_SELECTOR`). Throw immédiat si une valeur manque (ni option ni env var).

**Méthodes** (toutes retournent des Promises ; les erreurs HTTP sont levées en `GladysApiError { status, code, message }`) :

| Méthode | Contrat |
|---|---|
| `connect()` | ouvre le WS, s'authentifie (`authenticate.integration-request`), **resynchronise** (`GET /device` + `GET /config`, cf. C.4 fiabilité), puis résout. Reconnexion automatique à vie avec backoff `min(1s·2^n, 60s)` ; chaque reconnexion refait auth + resync |
| `disconnect()` | ferme proprement (plus de reconnexion) |
| `externalId(suffix)` | helper → `` `ext:${selector}:${suffix}` `` (la seule façon documentée de construire un `external_id`) |
| `publishDiscoveredDevices(devices)` | `POST /discovered_device` (liste complète, remplace la précédente) |
| `getDevices()` | `GET /device` → devices créés par l'utilisateur ; met aussi à jour `gladys.devices` |
| `publishState(featureExternalId, value)` | `POST /state` — `value` number, ou `{ text }`, ou `{ state, created_at }` pour un état passé |
| `publishStates(states)` | batch `POST /state` (max 100, cf. C.3) |
| `publishCameraImage(deviceExternalId, imageBase64)` | `POST /camera/image` — nouvelle image d'une caméra (format `image/jpg;base64,...`, ≤ 150 Ko, cf. C.3) |
| `getConfig()` / `setConfig(partialConfig)` | `GET` / `POST /config` ; `getConfig` met aussi à jour `gladys.config` |
| `getStatus()` | `GET /status` |
| `setConnectionStatus(connected, message?)` | `POST /connection_status` — statut applicatif affiché dans l'UI (C.3) ; `message` multi-langue optionnel |
| `getContainers()` | `GET /container` → sous-conteneurs déclarés, état, état désiré, ports hôte assignés (C.3) |
| `startContainer(name, { env }?)` | `POST /container/:name/start` — typiquement après avoir généré ses fichiers de config dans `/data` (pattern Mosquitto, cf. B.2) ; `env` optionnel pour les valeurs calculées au runtime |
| `stopContainer(name)` | `POST /container/:name/stop` — le superviseur ne le redémarrera pas |
| `restartContainer(name)` | `POST /container/:name/restart` — après avoir réécrit sa config via `/data` (pattern Frigate, cf. B.2) |

**Handlers** (enregistrement avant `connect()` ; **ack automatique** pour les commandes : le handler résout → `command-result success:true` — et si la valeur résolue n'est pas `undefined`, elle part dans `data` (C.4) —, il throw → `success:false` avec `error.message`, handler absent → `success:false "not implemented"`) :

| Handler | Signature du callback |
|---|---|
| `onSetValue(cb)` | `(device, deviceFeature, value) => Promise` |
| `onPoll(cb)` | `(device) => Promise` (répondre en publiant les états via `publishState`) |
| `onGetImage(cb)` | `(device) => Promise<string>` — capturer et résoudre une image fraîche (`image/jpg;base64,...`) ; elle part dans `data.image` (C.4, délai 15 s) |
| `onScanRequest(cb)` | `() => Promise` (répondre via `publishDiscoveredDevices`) |
| `onDeviceCreated(cb)` / `onDeviceUpdated(cb)` / `onDeviceDeleted(cb)` | `(device) => Promise` |
| `onConfigUpdated(cb)` | `(config) => Promise` (valeurs complètes, cf. C.4) |
| `onHardwareUpdated(cb)` | `(containers) => Promise` — les octrois matériels ont changé (C.4) : régénérer les configs concernées puis `startContainer`/`restartContainer` |
| `onOAuthAuthorizeUrl(cb)` | `(key, redirectUri) => Promise<string>` — construire l'URL d'autorisation (client_id de la config, scopes, `state` généré et retenu) ; la string résolue part dans `data.authorize_url` |
| `onOAuthCallback(cb)` | `(key, { code, state, redirectUri }) => Promise` — vérifier `state`, échanger les tokens, les stocker via `setConfig` (clés hors schéma), puis `setConnectionStatus(true)` |
| `onAction(key, cb)` | `(fields) => Promise<string \| object>` — handler d'une action déclarée (C.1), enregistré par `key` ; la valeur résolue part dans `data.message` (le délai d'ack est le `timeout_seconds` de l'action) |

**État local tenu par le SDK** (rafraîchi à chaque (re)connexion et par les événements `device-created/updated/deleted` et `config-updated`) : `gladys.devices` (array), `gladys.config` (objet), `gladys.connected` (boolean). Cycle de vie observable : `gladys.on('connected')`, `gladys.on('disconnected')` (la classe étend `EventEmitter`) — utile pour suspendre un polling quand Gladys est injoignable.

**Garanties de comportement** : répond aux pings WS protocolaires (natif lib `ws`) ; ne loggue rien par défaut (stdout appartient à l'intégration) sauf `DEBUG=gladys-integration-sdk` ; aucun état persisté sur disque par le SDK (tout se resynchronise, `/data` reste à la main de l'intégration) ; un type de message inconnu est ignoré silencieusement (compatibilité ascendante, cf. C.4).

## Ordre d'implémentation (jalons = commits d'une seule PR)

Une **seule PR de bout en bout** sur le monorepo — c'est elle que le mainteneur teste (checkout d'une branche, un build, tout le parcours). Les jalons ci-dessous sont l'**ordre de travail interne** : chacun correspond à un commit (ou groupe de commits) cohérent avec ses tests verts, ce qui permet une review commit par commit et un bisect facile, sans éparpiller la feature en morceaux non testables.

1. **Jalon 1 — Socle superviseur** : constantes (`SERVICE_TYPES`, `SERVICE_STATUS.DEGRADED`), migration `addColumn` sur `t_service` + modèle, `system.createNetwork|inspectNetwork|getImageLabels`, lib `external-integration` (sans WS/commandes), câblage `lib/index.js`, API admin + tests. → on installe/démarre/arrête un conteneur verrouillé via l'API.
2. **Jalon 2 — API-hôte** : `utils/integrationToken.js` (génération/validation JWT), middleware, flag `externalIntegrationAuth`, contrôleur `/api/integration/v1/*` (discovered_device, device en lecture, state, camera/image, config) + tests d'isolation. → une intégration publie ses appareils découverts, des états et des images caméra.
3. **Jalon 3 — WS + commandes + santé** : extension WebsocketManager, connected/disconnected, `sendCommand` + ack/timeout (`command-result` avec `data`), proxy-service (setValue + postCreate/postUpdate/postDelete), scan request, relais OAuth (`oauth.get-authorize-url`/`oauth.callback`), actions (`action.run`, timeout par action) et caméra (`camera.get-image`, timeout 15 s, proxy-service `getImage`), `connection_status`, upsert des `params` au re-publish, `poll` no-op hors RUNNING/DEGRADED, heartbeat, checkHealth + backoff + DEGRADED/FAILED. → machine à états complète, `setValue` atteint le conteneur, l'intégration est notifiée des créations/suppressions.
4. **Jalon 4 — Store côté serveur** : migration `store_slug`, lib `store/` (fetch + cache + compatibilité + updates), endpoints `GET .../store`, `POST .../store/refresh`, install par `store_slug`, `POST .../:selector/update` + tests. En parallèle (hors monorepo) : repo `GladysAssistant/integration-store` (Action d'indexation, JSON Schema du manifeste, GitHub Pages). → le catalogue est alimenté par l'index, install/update en un clic par API.
5. **Jalon 5 — Front** : intégrations externes du store dans le catalogue (badge « externe », écran d'installation avec avertissement, statut temps réel, mise à jour disponible, install dev), page générique 3 écrans Appareils/Découverte/Configuration (formulaire généré depuis `config_schema`, dont le champ `oauth2` + route de callback, section Actions, statut de connexion applicatif, heure de démarrage, bouton « Mettre à jour » en Découverte, avertissement double instance), logs, i18n.
6. **Jalon 6 — Sous-conteneurs** : validation du champ `containers` (dont ports et classes matérielles), réseau privé par intégration, état désiré/santé/réconciliation dans le superviseur, assignation des ports hôte, `system.detectHardwareClasses()` + octrois (`granted_devices`, `GET .../hardware`, `POST .../:selector/hardware`, push `hardware-updated`), endpoints `/container` (liste/start/stop/restart), front (ports + interrupteurs matériel sur l'écran d'installation, états + sélecteur de logs + liens « Ouvrir » + section Matériel dans le bloc de supervision) + tests sur fixture type Frigate + Mosquitto. → une intégration multi-conteneurs s'installe, expose son UI, accède au Coral **que l'utilisateur a explicitement accordé**, et se désinstalle sans rien laisser derrière elle.
Le SDK, le template/PoC et la documentation du site ne sont **pas** des jalons du monorepo : ce sont les chantiers `integration-sdk-js` (B.10, C.8), `integration-template-js` (B.11) et `v4-website` (B.12), menés en parallèle dans leurs propres repos.

## Répartition par repo (exécution en parallèle)

Cinq chantiers indépendants, un par repo — les contrats qui les découplent sont tous en section C (`manifest.schema.json`, `index.json`, API-hôte, protocole WS), donc ils peuvent avancer en parallèle avec des fixtures/mocks :

| Chantier | Repo | Périmètre (sections) | Consignes d'exécution |
|---|---|---|---|
| **Stack Gladys** | `GladysAssistant/Gladys` (monorepo) | B.1–B.9 (côté Gladys), B.13, C.2–C.5, C.7 — serveur + front | **Une seule PR de bout en bout, testable par le mainteneur**, structurée en **un commit (ou groupe de commits) par jalon** (1 → 6, tests verts à chaque jalon — la review se fait commit par commit) ; PR ouverte en draft dès le jalon 1 pour faire tourner la CI en continu ; embarque une **copie vendorée** du `manifest.schema.json` |
| **Indexeur du store** | `GladysAssistant/integration-store` (nouveau) | B.9 (indexeur), B.13 (tests indexeur), C.1, C.6 | **Propriétaire canonique du `manifest.schema.json`** (publié sur Pages à côté de l'index) ; Action planifiée + tests sur fixtures, CI propre |
| **SDK JS** | `GladysAssistant/integration-sdk-js` (nouveau) | B.10, C.8 (+ consomme C.2–C.4 et C.7) | Paquet npm `@gladysassistant/integration-sdk`, bibliothèque seule ; **ne dépend que des contrats C, aucun import du monorepo** ; testable contre un faux serveur (mocks des endpoints C.3 + WS C.4) |
| **Template/PoC** | `GladysAssistant/integration-template-js` (nouveau) | B.11, C.1, C.7 (+ consomme C.8) | Intégration demo complète (Open-Meteo + interrupteur virtuel), manifeste + cover conformes, Dockerfile + workflow buildx multi-arch ; dépend du SDK (via git pendant le développement parallèle, npm ensuite) ; c'est lui qui déroule le parcours e2e |
| **Documentation** | `GladysAssistant/v4-website` (existant) | B.12 (contenu transposé des sections B/C) | Doc utilisateur « interne vs externe » + doc développeur (tutoriel + référence), **fr + en**, dans la structure existante du site (auditer l'arborescence avant d'écrire) ; chantier purement doc, aucun code — peut démarrer dès que la spec est gelée |

Hors code (étapes manuelles, après les chantiers) : activer GitHub Pages sur `integration-store`, publier le paquet npm du SDK, marquer `integration-template-js` « Template repository », pousser son image multi-arch sur un registre public et lui ajouter le topic `gladys-assistant-integration` **comme le ferait un dev tiers** (c'est le test du chemin zéro approbation), déployer la doc du site, puis dérouler le parcours e2e de la section Vérification.

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
2. **Parcours e2e manuel** (environnement avec socket Docker) : publier le repo template `integration-template-js` (B.11) comme le ferait un dev tiers (topic `gladys-assistant-integration` + `gladys-assistant-integration.json` à la racine + image multi-arch poussée sur un registre public) → attendre/déclencher l'indexation → la demo apparaît dans le catalogue de Gladys avec le badge « externe », **sans aucune approbation** → installation en un clic (écran d'avertissement) → la carte apparaît dans la liste avec le badge « externe », statut `Démarrage → En fonctionnement` en temps réel → écran Configuration : formulaire latitude/longitude généré depuis le `config_schema`, sauvegarde → l'intégration reçoit `CONFIG_UPDATED` → les appareils demo apparaissent dans l'écran Découverte → création depuis l'UI → l'intégration reçoit `DEVICE_CREATED` et publie ses états, devices visibles dans l'écran Appareils et le dashboard → actionner l'interrupteur virtuel (commande reçue dans les logs du conteneur, état republié) → `docker kill` du conteneur → statut `Dégradée` puis redémarrage auto → forcer 5 crashs → statut `En panne` avec logs visibles et bouton redémarrer → bumper `version` dans le manifeste du repo template → après ré-indexation, badge « mise à jour disponible » → update en un clic (nouveau conteneur, ancien JWT invalidé) → désinstallation propre (conteneur supprimé, ligne `t_service` détruite, ancien JWT refusé).
3. Test d'isolation manuel : appeler l'API-hôte avec le token d'une intégration sur les devices d'une autre → 403/404 ; avec un access token utilisateur → 401 (mauvaise audience) ; avec un token d'ancienne `token_version` après recréation du conteneur → 401.
4. **Test multi-conteneurs manuel** : installer (mode dev) un manifeste déclarant un sous-conteneur `mqtt` (image `eclipse-mosquitto`, `start: "manual"`, un port publié) et une classe matérielle (`gpu`) → l'écran d'installation liste le sous-conteneur, son port, ses limites, et la ligne Matériel avec l'état de détection + interrupteur (le laisser décoché : `GET /container` montre `granted: false`, rien n'est monté ; l'activer ensuite depuis la section Matériel de l'écran Configuration → sous-conteneur recréé, l'intégration reçoit `hardware-updated`) → après install, réseau privé `gladys-int-<selector>` créé, `mqtt` **pas encore démarré** → le principal écrit le fichier de mots de passe via `/data/containers/mqtt/` puis `POST /container/mqtt/start` → broker démarré, joignable en `mqtt:1883` par DNS, port hôte assigné visible dans `GET /container` et cliquable dans le bloc de supervision → `docker kill` du sous-conteneur → redémarré par le superviseur (état désiré, backoff, `failure_count`) → `POST /container/mqtt/stop` → reste arrêté (pas de restart auto) → désinstallation → `docker ps -a` et `docker network ls` propres, port libéré, dossier data supprimé.
