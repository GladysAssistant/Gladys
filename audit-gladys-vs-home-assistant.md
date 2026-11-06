# Audit produit — Gladys Assistant face à Home Assistant

6 novembre 2026. Gladys 5.3.1 comparé à Home Assistant 2026.11.0.

## 1. En bref

**Sur la compatibilité, tu as raison : l'écart en nombre est comblé.**

- Gladys affiche 1 068 intégrations.
- Le cœur de Home Assistant en compte environ 1 600, dont 1 240 hors intégrations virtuelles et système (comptées dans le conteneur 2026.11).
- J'ai cherché environ 120 marques courantes dans le store : presque toutes y ont une entrée.

**Mais le problème a changé de forme.** La question n'est plus « mon appareil est-il supporté ? », c'est « est-ce que ça marche, et est-ce que je peux compter dessus ? » :

- 93 % des intégrations du store ont moins de six semaines ;
- 70 % viennent de deux auteurs ;
- aucune n'est revue ;
- aucune n'affiche son nombre d'utilisateurs.

Ce qui manque le plus à Gladys en tant que produit, dans l'ordre :

1. **La confiance dans le store** : signaux d'usage, intégrations vérifiées, tests, gestion des intégrations orphelines.
2. **Comprendre ce que fait sa maison** : trace des exécutions de scènes, appareils indisponibles, scènes liées à un appareil. Ce sont les trois demandes ouvertes les plus votées du forum.
3. **Un filet de sécurité gratuit** : sauvegarde locale et retour arrière, aujourd'hui réservés à Gladys Plus (ou absents), alors qu'ils sont gratuits chez Home Assistant.
4. **Le téléphone** : notifications push, puis une application.
5. **L'IA qui écrit et corrige les scènes.** C'est le « workflow principal » de certains utilisateurs de Home Assistant, et Gladys a déjà l'infrastructure pour le faire.

Viennent ensuite des chantiers structurants mais coûteux :

- matériel clé en main ;
- voix locale ;
- Thread et Matter complets ;
- international.

Home Assistant a aussi des faiblesses que Gladys peut viser plutôt que de seulement rattraper :

- droits par utilisateur : demande n°1 de leur « Month of What the Heck » 2026, avec 390 votes ;
- notifications jugées difficiles : 242 votes ;
- mises à jour qui cassent ;
- voix locale non entièrement prise en charge en français ;
- Linky en mode standard non géré par l'intégration officielle.

### Les deux produits en chiffres

| | Home Assistant | Gladys |
| --- | --- | --- |
| Installations actives | 721 270 en opt-in, alors que moins d'un quart des utilisateurs l'activent ; « plus de 2,7 millions de foyers » revendiqués ; +34 % en un an | non publié |
| Installations en France | 38 500 en opt-in (5e pays) | non publié |
| Intégrations du cœur | ~1 600 ; 379 avec un niveau de qualité Bronze à Platinum | 37 natives, dont 19 dépréciées |
| Intégrations communautaires | Marketplace (ex-HACS, intégrée en 2026.11), non revue ; HACS présent sur 374 635 installations | store : 1 031, non revu |
| Langues de l'interface | 66 | 4 (en, fr, de, es) |
| Utilisateurs actifs du forum sur 30 jours | 26 307 (plus 160 000 membres Discord) | 163 |
| GitHub | ~92 000 étoiles, 21 000+ contributeurs en 2024 | ~3 270 étoiles, 60 contributeurs |
| Abonnement cloud | 7,50 €/mois ou 75 €/an ; devient « Home Assistant Link » le 2 décembre | Gladys Plus Lite : 6,99 €/mois ou 69,99 €/an ; complet : 9,99 €/mois ou 99,99 €/an |
| Matériel officiel | Green 179 €, ZBT-2 45 €, ZWA-2 59 €, Voice PE 59 € | kits en pause, installeur USB Gladys Assistant OS depuis le 1er novembre |

## 2. Compatibilité : le trou est comblé sur le papier, pas encore dans la confiance

Les intégrations externes ont changé l'échelle. Le catalogue affiche **1 068 intégrations** : 1 031 du store et 37 natives, dont 19 natives marquées dépréciées au profit du store. J'ai cherché environ 120 marques courantes dans le store. Presque toutes ont une entrée : Shelly, ESPHome, Tuya, Xiaomi, Hue, IKEA Dirigera, Netatmo/Legrand, Somfy/Overkiz, Tado, Daikin, Freebox, Livebox, Bbox, Roborock, Dreame, UniFi, Reolink, Frigate, KNX, Modbus, Victron, Enphase, SolarEdge, Tesla, Renault, Stellantis, Home Connect, Miele, SwitchBot, WLED, Tydom, Atlantic Cozytouch, Octopus, etc.

Les seules absences notables que j'ai trouvées :

- une passerelle Aqara native ;
- Denon/HEOS ;
- toute brique de voix locale (Whisper, Piper, Wyoming).

Le problème a changé de nature. Ce qui manque, ce n'est plus la liste des marques, c'est **la preuve que ça marche**. Mon analyse de l'index du store, généré le 6 novembre 2026 :

| Indicateur | Valeur |
| --- | --- |
| Entrées apparues depuis le 1er octobre 2026 | 955 sur 1 031 (93 %) |
| Entrées publiées par les 2 premiers auteurs | 718 (70 %) — guim31 : 414, LM1LC3N7 : 304 |
| Auteurs distincts | 32 |
| Dépôts GitHub à 0 étoile | 1 003 (97 %) ; aucun n'en a plus d'une |
| Versions 0.x, 1.0.0 ou 1.0.1 | 779 (76 %) |
| Local / cloud / les deux | 485 / 452 / 83 |
| Revue avant publication | aucune (topic GitHub suffit) |
| Nombre d'installations affiché par intégration | non |

Quatre conséquences produit :

1. **L'utilisateur ne sait pas ce qui est fiable.**
    - Pas de compteur d'installations ni de note.
    - Pas de « testé avec un vrai appareil ».
    - Pas de niveau de qualité.
    - Pour son cœur, Home Assistant affiche un niveau de qualité (379 intégrations notées de Bronze à Platinum) et publie le nombre d'installations de chaque intégration sur [analytics.home-assistant.io](https://analytics.home-assistant.io/integrations).
    - Sa nouvelle Marketplace communautaire (2026.11, ex-HACS) n'est pas revue non plus : elle prévient que ce code n'est « ni testé, ni audité, ni supporté ».
    - Gladys peut donc se distinguer en devenant le store communautaire où l'on sait ce qui marche.
2. **Le risque de maintenance est concentré.** Si deux auteurs arrêtent, 70 % du catalogue n'a plus de mainteneur. Il n'existe pas de politique d'abandon ou de reprise.
3. **Chaque intégration coûte un conteneur.** Les intégrations coûtent chacune 20 à 40 Mo, plafonnés à 256 Mo. Un utilisateur trouve déjà que le chargement ralentit avec 9 intégrations (forum T/11345). Sur une petite machine, c'est une vraie limite.
4. **La stabilité a souffert de la croissance.** Toi-même, le 25 octobre : « avec la croissance très rapide des intégrations externes, certaines choses avaient commencé à casser… La stabilité est maintenant ma priorité » (T/10865).

Ce qu'il manque pour transformer ce catalogue en avantage :

- des signaux de confiance dans le catalogue :
    - installations actives (opt-in, anonymes) ;
    - retours « fonctionne chez moi / ne fonctionne pas » avec le modèle d'appareil ;
    - date du dernier test ;
- un badge « vérifié » attribué automatiquement : tests de contrat du SDK passés, installations actives et peu d'erreurs remontées par la supervision ;
- une politique de cycle de vie : intégration orpheline signalée, adoption par un autre auteur, compatibilité testée à chaque version de Gladys ;
- une marque « comment c'est fait » : par l'auteur, généré avec IA, testé sur matériel réel.

Aucun de ces signaux n'oblige à revenir sur le choix « zéro approbation » du store (`docs/specs/external-integrations/core/store.md`). Ils informent l'utilisateur sans bloquer l'auteur.

## 3. Comparatif domaine par domaine

L'écart est qualifié du point de vue de quelqu'un qui hésite entre les deux produits.

| Domaine | Home Assistant 2026.11 | Gladys 5.3.1 | Écart |
| --- | --- | --- | --- |
| Installation et matériel | HA OS sur 79,5 % des installations ; box Green ; clés radio officielles ; « apps » (ex-add-ons) | Docker ou installeur USB Gladys OS ; plus de box en vente | **Fort** |
| Intégrations | ~1 600 dans le cœur, revues, avec niveau de qualité et nombre d'installations publics ; Marketplace communautaire | 1 068, dont 1 031 communautaires non revues | **Moyen** : nombre comblé, confiance non |
| Protocoles | Zigbee (ZHA ou Z2M) ; Z-Wave Long Range ; Matter certifié CSA (38 % des instances) ; Thread ; proxies Bluetooth ; infrarouge et RF via ESPHome ; LoRaWAN | Z2M natif ; Matter en contrôleur seulement (26 clusters sur 132, pas de pont) ; Z-Wave, ESPHome, KNX, Modbus via le store ; ni routeur Thread ni proxy Bluetooth | **Moyen** |
| Tableaux de bord | tableau « Home » généré par défaut (2026.2) ; tableaux Maintenance et Sécurité (2026.5) ; choix des cartes par l'objet affiché | 26 widgets ; sections flexibles ; thème Horizon ; mode tablette ; widgets fournis par les intégrations | **Faible** : il manque la génération automatique et une vue maintenance |
| Automatisations | déclencheurs « par usage » par défaut (2026.7) ; blueprints ; scripts ; entrées (helpers) ; templates | scènes en blocs : 22 déclencheurs, 40 actions, 13 conditions ; si/sinon ; variables ; formules | **Moyen** : il manque le partage, les groupes et les capteurs calculés |
| Débogage | traces d'exécution ; vrai/faux en direct sur les conditions (2026.6) ; journal qui explique pourquoi un état a changé (2026.9) | fil d'activité des appareils ; aucun historique d'exécution des scènes | **Fort** |
| Mobile et notifications | apps natives iOS et Android (1,5 M d'installations Android) ; notifications actionnables ; CarPlay, Android Auto, montres | PWA sans push ; OwnTracks ; messageries (Telegram, ntfy…) | **Fort** |
| Voix | Assist ; Voice PE ; reconnaissance vocale locale (Speech-to-Phrase, Wyoming) ; deux mots de réveil ; français local non « entièrement pris en charge » | widget vocal ; reconnaissance vocale via Gladys Plus uniquement ; pas de mot de réveil | **Moyen** : Home Assistant est faible en français aussi |
| IA | agents de conversation (OpenAI, Gemini, Anthropic, Ollama) ; AI Task ; boutons « Suggérer avec l'IA » ; serveur MCP en un clic | chat IA ; LLM hébergé en France ou fournisseurs du store ; MCP (14 outils) ; action « demander à l'IA » | **Faible** : il manque l'IA dans l'éditeur de scènes |
| Énergie | flux d'énergie ; solaire, batterie, gaz, eau, appareils ; puissance en temps réel ; Teleinfo du cœur limitée au mode historique ; Tempo et Linky via HACS | contrats et tarifs français riches (Tempo, heures creuses, EcoWatt) ; coût par appareil ; hiérarchie des compteurs ; Enedis via Gladys Plus | **Mixte** : Gladys devant sur les tarifs, derrière sur le flux, la production, le gaz et l'eau |
| Historique | recorder ; statistiques long terme | DuckDB ; agrégats ; export CSV | **Faible** |
| Sauvegardes | automatiques ; chiffrées (format audité par Trail of Bits) ; locales et gratuites ; Google Drive, OneDrive, disque local | uniquement via Gladys Plus | **Fort** |
| Droits des utilisateurs | admin / non-admin ; c'est la demande n°1 de leur communauté | admin / utilisateur | **Égal** : occasion de faire mieux |
| International | 66 langues | 4 langues ; documentation et forum d'abord en français | **Fort** |

## 4. Ce que disent les utilisateurs

Les demandes les plus votées de l'histoire du forum ont toutes été livrées :

- la voix ;
- le si/alors/sinon ;
- la présence réseau ;
- le mode sombre ;
- Tuya ;
- le chauffage ;
- l'alarme.

Les votes restants sont faibles en absolu (10 au maximum). Ils dessinent pourtant un thème net : **comprendre et fiabiliser ce que fait sa maison**.

| Demande ouverte | Votes | Statut |
| --- | --- | --- |
| [Savoir ce qui a déclenché une scène](https://community.gladysassistant.com/t/8534) | 10 | en cours |
| [« Continuer seulement si » avec les valeurs actuelles](https://community.gladysassistant.com/t/6502) | 10 | en cours |
| [Voir, corriger, supprimer des valeurs d'historique](https://community.gladysassistant.com/t/9899) | 10 | PR ouverte |
| [Jeton d'API local longue durée](https://community.gladysassistant.com/t/5540) | 9 | répondu par l'API Gladys Plus |
| [Graphique de flux d'énergie](https://community.gladysassistant.com/t/11316) | 8 | ouvert |
| [Sauvegarde locale sans Gladys Plus](https://community.gladysassistant.com/t/8840) | 8 | ouvert |
| [Voir un appareil réseau sans le lier à une personne](https://community.gladysassistant.com/t/8520) | 8 | ouvert |
| [Services déportés sur un autre Raspberry Pi](https://community.gladysassistant.com/t/6152) | 8 | ouvert |
| [Quelles scènes utilisent cet appareil](https://community.gladysassistant.com/t/9652) | 7 + 7 | ouvert |
| [Lancer un script Python/Bash/JS depuis une scène](https://community.gladysassistant.com/t/5502) | 5 | ouvert |
| [Exporter et partager des scènes (équivalent blueprints)](https://community.gladysassistant.com/t/10438) | récente (2026) | ouvert |

Les irritants qui reviennent hors votes :

- **Déboguer une scène est impossible.** Un utilisateur : « je ne trouve pas de moyen simple de déboguer les scènes, c'est crucial » ([T/10140](https://community.gladysassistant.com/t/10140)). La parade habituelle consiste à s'envoyer un message Telegram à chaque étape. Le code confirme qu'il n'y a pas d'historique d'exécution des scènes (`server/lib/scene/` n'a que `scene.getRunning`).
- **Pas d'application mobile ni de notification push.** Les notifications passent par Telegram ou ntfy, qui ne distinguent pas une alarme d'une info de routine ([T/10942](https://community.gladysassistant.com/t/10942)). Un blogueur parle de « la brique manquante » ([Antoine Guilbert](https://www.antoineguilbert.fr/gladys-assistant-alternative-home-assistant/)). Les utilisateurs de tablettes murales n'ont ni écran de veille, ni réveil sur mouvement, ni batterie de la tablette ([T/11345](https://community.gladysassistant.com/t/11345)).
- **Des bases derrière l'abonnement.** Gladys Plus est obligatoire pour :
    - les sauvegardes ;
    - l'accès distant ;
    - la reconnaissance vocale ;
    - Enedis, alors qu'elle est gratuite sur HA : « 99 €/an juste pour ça, c'est trop cher » ([T/9083](https://community.gladysassistant.com/t/9083)).
- **L'installation reste le mur pour les non-développeurs.** Un utilisateur cite Docker et le NAS, et demande une box clé en main comme Home Assistant Green ([T/9912](https://community.gladysassistant.com/t/9912)). Gladys Assistant OS (installeur USB) est sorti le 1er novembre.
- **Le projet paraît franco-centré** : « une communauté surtout française limite le développement » ([HACF](https://forum.hacf.fr/t/que-pensez-vous-de-gladys-assistant-projet-open-source-francais-de-domotique/10399)).

Ce qui fait venir des gens de Home Assistant vers Gladys, en 2026 :

- **La stabilité perçue :**
    - « instabilité sur instabilité… en trois jours j'avais tout refait sous Gladys » ([T/10140](https://community.gladysassistant.com/t/10140)) ;
    - « des mises à jour constantes, la programmation YAML, une vraie plaie » ([T/10029](https://community.gladysassistant.com/t/10029)).
- **La simplicité.** Un utilisateur a migré 80 % de son installation Home Assistant et plus de 30 scènes en moins de trois jours ([T/11345](https://community.gladysassistant.com/t/11345)).

Ce qui retient les gens sur Home Assistant :

- l'historique des intégrations ;
- Enedis gratuit ;
- **créer et modifier ses automatisations avec l'IA** (« sur HA c'est mon workflow principal ») ;
- la préférence pour Python.

Côté Home Assistant, le « Month of What the Heck » 2026 ([votes au 6 novembre](https://community.home-assistant.io/c/month-of-what-the-heck/64)) montre où ses utilisateurs souffrent. Plusieurs points sont des occasions pour Gladys :

| Plainte des utilisateurs de Home Assistant | Votes | Occasion pour Gladys |
| --- | --- | --- |
| Pas de droits par utilisateur | 390 | droits par membre du foyer |
| Notifier les gens est difficile | 242 | notifications simples avec niveaux d'urgence |
| Les entrées (helpers) sont dures à trouver | 184 | groupes et capteurs calculés intégrés aux appareils |
| Renommer une entité casse les références | 139 | chez Gladys, renommer un appareil ne change pas son sélecteur : à garder |
| Appareils éteints traités comme des pannes | 119 | un état « indisponible » bien pensé |
| « 48 versions par an » : demande d'un canal stable | 85 | mises à jour sans casse, retour arrière |

Autres faiblesses de Home Assistant :

- seuls 46 % des conjoints et 27 % des enfants des utilisateurs de longue date se servent de Home Assistant directement ([roadmap 2025](https://www.home-assistant.io/blog/2025/05/09/roadmap-2025h1/)) ;
- la voix est encore en « Preview » après deux ans ;
- la box Green a pris deux hausses de prix en 2026.

## 5. Test en main propre

J'ai installé Home Assistant 2026.11.0 (conteneur Docker officiel) et Gladys 5.3.1 (sources, mode dev) côte à côte. Je n'avais aucun appareil réel. Les intégrations externes de Gladys n'ont pas pu être installées, car elles exigent que Gladys tourne lui-même dans Docker. L'analytics de Home Assistant est restée désactivée.

| Étape | Home Assistant 2026.11 | Gladys 5.3.1 |
| --- | --- | --- |
| Onboarding | 4 écrans : compte, adresse sur carte, pays, analytics (4 interrupteurs, tous désactivés par défaut) | 5 écrans : bienvenue, compte, préférences (unités, rétention), maison + pièces sur carte, succès |
| Pièces | créées automatiquement (Salon, Cuisine, Chambre) | saisies à la main pendant l'onboarding |
| Premier écran | tableau de bord « Vue d'ensemble » généré à partir des pièces, mis à jour seul | checklist « 0 sur 4 » : appareils, tableau de bord, scènes, foyer |
| Ajout d'intégration | liste de marques avec recherche ; découverte réseau automatique proposée | catalogue visuel de 1 068 fiches, filtres local/cloud/natif/communauté, 18 catégories, installation depuis GitHub |
| Automatisation | nouveau sélecteur « Par cible » : on choisit une pièce, une personne, l'heure ou le soleil, puis le déclencheur | éditeur de scènes en blocs, 22 déclencheurs, 40 actions, 13 conditions |
| Énergie | assistant en 6 étapes : réseau, solaire, batterie, gaz, eau, appareils | contrats et tarifs détaillés (Tempo, HP/HC…), pas de page Énergie de premier niveau |
| Sauvegardes | locales et automatiques, chiffrées, gratuites | écran qui renvoie vers l'essai Gladys Plus |

Mon impression :

- **Gladys est plus chaleureux et plus guidé.** La checklist de départ et le catalogue d'intégrations sont meilleurs que ceux de Home Assistant.
- **Home Assistant gagne sur ce qui se passe « tout seul » :**
    - pièces créées par défaut ;
    - tableau de bord généré ;
    - découverte automatique ;
    - sauvegardes locales actives sans rien payer.

## 6. Les manques, par priorité

Classement selon deux critères : l'effet sur la décision « je choisis Gladys / je reste sur Gladys », et l'effort estimé.

### Priorité 1 : impact fort, effort raisonnable

1. **Rendre le store digne de confiance.**
    - Installations actives par intégration (opt-in).
    - Retours « fonctionne avec mon appareil X ».
    - Badge « vérifié » sur les intégrations les plus installées.
    - Tests de contrat fournis par le SDK et rejoués à chaque version de Gladys.
    - Signalement des intégrations orphelines.
    - C'est ce qui transforme « 1 000 intégrations » en argument crédible face à un utilisateur de Home Assistant.
2. **Déboguer ses scènes.**
    - Trace de chaque exécution : quel déclencheur, quelles conditions vraies ou fausses, quelles actions, quelles erreurs.
    - Page « quelles scènes utilisent cet appareil ».
    - État disponible / indisponible des appareils, regroupé avec les piles faibles dans une vue « maintenance ».
    - Ce sont les trois demandes ouvertes les plus votées, et l'irritant le plus cité. Home Assistant a les traces d'automatisation depuis 2021.
3. **Sauvegarde locale gratuite et retour arrière.**
    - Instantané automatique avant chaque mise à jour, de Gladys comme d'une intégration, et retour arrière en un clic. Home Assistant l'a mis dans sa roadmap : « redonner aux utilisateurs un chemin vers une configuration qui marche ».
    - Garder dans Gladys Plus la sauvegarde hors site chiffrée et la restauration en un clic. Faire payer la sécurité des données d'un logiciel « privacy-first » braque les utilisateurs, alors que Home Assistant l'offre en local. Gladys Plus se vend mieux sur le confort (hors site, accès distant, IA hébergée) que sur la peur de tout perdre.
4. **Notifications push.**
    - Première étape peu coûteuse : le Web Push de la PWA, avec niveaux info / important / critique et boutons d'action. Il fonctionne sur Android et sur iOS 16.4 et plus pour une PWA installée.
    - Étape suivante : une coque native (Capacitor, un prototype communautaire existe : [T/10769](https://community.gladysassistant.com/t/10769)) pour les alertes critiques iOS, la géolocalisation et le mode tablette murale.
5. **L'IA qui écrit et modifie les scènes.**
    - Le serveur MCP sait déjà créer une scène.
    - Il reste à exposer la modification d'une scène, puis un champ « décris ce que tu veux » dans l'éditeur de scènes.
    - C'est le workflow principal de certains utilisateurs de Home Assistant, et Gladys a déjà l'infrastructure : LLM hébergé en France, fournisseurs d'IA par le store.

### Priorité 2 : impact moyen

6. **Partager ses scènes.** Export et import JSON, puis des modèles paramétrables, l'équivalent des blueprints ([T/10438](https://community.gladysassistant.com/t/10438)). Les modèles de scènes peuvent aussi enrichir l'onboarding : « au coucher du soleil, allumer… ».
7. **Groupes d'appareils et capteurs virtuels.** Groupe de lumières, moyenne de températures, capteur calculé ([T/10707](https://community.gladysassistant.com/t/10707), [T/10966](https://community.gladysassistant.com/t/10966)). Home Assistant appelle ça les « entrées » ou « helpers ».
8. **Tableau de bord généré automatiquement.** À partir des pièces et des appareils, comme la « Vue d'ensemble » de Home Assistant, au lieu d'un écran vide après l'onboarding.
9. **Voix locale.**
    - La reconnaissance vocale passe aujourd'hui uniquement par Gladys Plus.
    - Ajouter un type d'intégration `stt` (et un mot de réveil) au store permettrait à Whisper, Vosk ou Wyoming de s'y brancher, comme le type `tts` existe déjà.
10. **Énergie : flux, production et autres fluides.**
    - Graphique de flux réseau / solaire / batterie / maison ([T/11316](https://community.gladysassistant.com/t/11316)).
    - Revente du surplus solaire.
    - Gaz et eau.
    - Les contrats de gaz, d'eau et de production sont prévus dans le modèle mais refusés en v1 (`docs/specs/energy-contracts.md`).

### Priorité 3 : structurant mais coûteux

11. **Matériel clé en main.** Une box prête à brancher et une clé radio Zigbee/Thread officielle. Plutôt via un partenaire, vu le coût des mini-PC que tu cites, qu'en fabrication propre.
12. **Thread et Matter complets.**
    - Routeur de bordure Thread.
    - Exposition des appareils Gladys en Matter (pont), pour Apple, Google et Amazon sans cloud.
    - Couverture des clusters Matter : 26 sur 132 aujourd'hui.
13. **International.**
    - 4 langues d'interface aujourd'hui.
    - Documentation et captures en anglais d'abord.
    - Le forum fusionné avec traduction IA va dans le bon sens.
14. **Permissions fines par membre du foyer.** Invité, enfant, accès à certaines pièces seulement. Home Assistant est faible sur ce point : c'est une occasion de faire mieux que lui plutôt que de rattraper.
15. **Empreinte des intégrations.** Un mode « léger » pour les petites machines, par exemple plusieurs intégrations Node dans un même conteneur.

## 7. Là où Gladys gagne déjà

Ces points ressortent à la fois du test et des retours d'utilisateurs. Il faut les protéger en comblant les manques :

- **La simplicité et la stabilité perçue.**
    - C'est la première raison citée par ceux qui quittent Home Assistant pour Gladys.
    - Elle passe par des mises à jour sans casse et zéro YAML.
    - Chaque nouvelle fonction doit rester sans configuration texte.
- **Un seul produit.** Pas de distinction intégrations / apps / HACS / cartes personnalisées : tout passe par un catalogue unique, avec installation depuis GitHub en un clic.
- **L'isolation des intégrations.** Une intégration plantée ne fait pas tomber le cœur, et elle n'a pas accès au socket Docker.
- **L'énergie à la française.** Les contrats et tarifs (Tempo, heures creuses, EcoWatt) vont plus loin que Home Assistant pour un utilisateur français.
- **L'IA souveraine.** LLM hébergé en France, serveur MCP, action « demander à l'IA » dans les scènes.
- **L'onboarding et l'interface Horizon.** Ils sont plus soignés et plus chaleureux que ceux de Home Assistant au premier contact.

## 8. Méthode et sources

**Méthode.**

- Inventaire du code de Gladys 5.3.1 (commit `ca702c3`).
- Analyse de l'index du store, généré le 6 novembre 2026 : `https://integration-store-storage.gladysassistant.com/index-lite.json`.
- Comptage des manifestes du conteneur Home Assistant 2026.11.0.
- Test des deux onboardings dans un navigateur.
- Lecture du forum Gladys via son API Discourse, du forum HACF, des notes de version et des statistiques de Home Assistant.
- Limites :
    - Reddit n'a pas pu être consulté ;
    - aucun appareil réel n'a été testé ;
    - le nombre d'installations de Gladys n'est pas public.

**Home Assistant**

- [Statistiques (installations, intégrations, pays)](https://analytics.home-assistant.io/)
- [Notes de version 2026.11](https://www.home-assistant.io/blog/2026/11/04/release-202611/) (Marketplace, naming)
- [Notes de version 2026.7](https://www.home-assistant.io/blog/2026/07/01/release-20267/) (déclencheurs par usage)
- [Notes de version 2026.2](https://www.home-assistant.io/blog/2026/02/04/release-20262/) (tableau Home par défaut, Apps)
- [Notes de version 2025.1](https://www.home-assistant.io/blog/2025/01/03/release-20251/) (sauvegardes)
- [Chiffrement des sauvegardes](https://www.home-assistant.io/blog/2026/03/26/modernizing-encryption-of-home-assistant-backups/)
- [Tarifs Nabu Casa](https://www.nabucasa.com/pricing/)
- [Cloud renommé « Link »](https://www.home-assistant.io/blog/2026/10/02/big-tech-ruined-the-cloud-so-were-renaming-ours/)
- [Prix de la Green](https://www.nabucasa.com/news/2026-01-08-green-pricing-change/)
- [Matter](https://www.home-assistant.io/blog/2026/06/23/the-matter-upgrade-youve-been-waiting-for/)
- [Application Android](https://www.home-assistant.io/blog/2025/07/23/companion-app-for-android/)
- [Voix et langues](https://www.home-assistant.io/voice_control/)
- [Teleinfo](https://www.home-assistant.io/integrations/teleinfo/)
- [Month of What the Heck 2026](https://www.home-assistant.io/blog/2026/10/29/what-the-heck-2026-everyone-at-home-gets-a-say/)
- [Roadmap publique](https://github.com/OpenHomeFoundation/roadmap)
- [Forum HACF](https://forum.hacf.fr/t/que-pensez-vous-de-gladys-assistant-projet-open-source-francais-de-domotique/10399)

**Gladys**

- Forum : [stabilité, priorité](https://community.gladysassistant.com/t/10865) ; [demandes de fonctionnalités](https://community.gladysassistant.com/c/43)
- Forum : [débogage des scènes](https://community.gladysassistant.com/t/10140) ; [notifications](https://community.gladysassistant.com/t/10942) ; [utilisateur venu d'openHAB et de Home Assistant](https://community.gladysassistant.com/t/11345)
- Forum : [Enedis et Gladys Plus](https://community.gladysassistant.com/t/9083) ; [box clé en main](https://community.gladysassistant.com/t/9912) ; [sauvegarde locale](https://community.gladysassistant.com/t/8840)
- [Avis d'Antoine Guilbert](https://www.antoineguilbert.fr/gladys-assistant-alternative-home-assistant/)
- [Gladys Plus](https://gladysassistant.com/fr/plus/)
- [Comparatif officiel HA vs Gladys](https://gladysassistant.com/fr/home-assistant-vs-gladys-assistant/)
