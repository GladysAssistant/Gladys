---
inject: true
to: ../front/src/config/i18n/fr.json
before: "\"openai\": {"
skip_if: "\"title\": \"<%= module %> configuration\","
---
    "<%= module %>": {
      "title": "<%= module %>",
      "description": "Contrôlez vos apareils <%= module %>.",
      "deviceTab": "Appareils",
      "discoverTab": "Découverte <%= module %>",
      "setupTab": "Configuration",
      "discoverDeviceDescr": "Scanner automatiquement les appareils <%= module %>",
      "nameLabel": "Nom de l'appareil",
      "namePlaceholder": "Entrez le nom de votre appareil",
      "modelLabel": "Modèle",
      "roomLabel": "Pièce",
      "saveButton": "Sauvegarder",
      "updateButton": "Mettre à jour",
      "alreadyCreatedButton": "Déjà créé",
      "deleteButton": "Supprimer",
      "unmanagedModelButton": "Modèle non pris en charge ou non disponible",
      "status": {
        "notConnected": "Gladys n'a pas réussi à se connecter au compte cloud <%= module %>, plus d'informations sur la ",
        "setupPageLink": "page de configuration <%= module %>.",
        "online": "En ligne",
        "offline": "Hors ligne"
      },
      "device": {
        "title": "Appareils <%= module %> dans Gladys",
        "search": "Rechercher les appareils",
        "updates": "Vérifier les mises à jour",
        "editButton": "Editer",
        "noDeviceFound": "Aucun appareil <%= module %> trouvé.",
        "featuresLabel": "Fonctionnalités"
      },
      "discover": {
        "title": "Appareils détectés sur votre compte cloud <%= module %>",
        "description": "Les appareils <%= module %> sont automatiquement découverts.",
        "error": "Erreur de découverte des appareils <%= module %>. Veuillez vérifier vos informations d'identification lors de l'installation.",
        "noDeviceFound": "Aucun appareil <%= module %> n'a été découvert.",
        "scan": "Scanner"
      },
      "setup": {
        "title": "Configuration <%= module %>",
        "<%= attributeName %>Description": "Vous pouvez connecter Gladys à votre compte cloud <%= module %> pour commander les appareils associés.",
        "userLabel": "Nom d'utilisateur",
        "userPlaceholder": "Entrez le nom d'utilisateur <%= module %>",
        "countryCodeLabel": "Code pays",
        "countryPlaceholder": "Entrez le code de votre pays (ex: fr)",
        "passwordLabel": "Mot de passe",
        "passwordPlaceholder": "Entrez le mot de passe utilisateur <%= module %>",
        "saveLabel": "Enregistrer la configuration",
        "error": "Une erreur s'est produite lors de la sauvegarde de la configuration.",
        "connecting": "Configuration sauvegardée. Connexion à votre compte cloud <%= module %>...",
        "connected": "Connexion réussie au compte cloud <%= module %> !",
        "connectionError": "Erreur lors de la connexion, veuillez vérifier votre configuration."
      },
      "error": {
        "defaultError": "Une erreur s'est produite lors de l'enregistrement de l'appareil.",
        "defaultDeletionError": "Une erreur s'est produite lors de la suppression de l'appareil.",
        "conflictError": "L'appareil actuel est déjà dans Gladys."
      }
    },