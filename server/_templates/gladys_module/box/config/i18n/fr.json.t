---
inject: true
to: ../front/src/config/i18n/fr.json
before: "\"openai\": {"
skip_if: "<%= module %>"
---
    "<%= module %>": {
      "title": "<%= module %>",
      "description": "Control your <%= module %> devices.",
      "deviceTab": "Devices",
      "discoverTab": "Discover <%= module %>",
      "setupTab": "Setup",
      "discoverDeviceDescr": "Automatically scan <%= module %> devices",
      "nameLabel": "Device Name",
      "namePlaceholder": "Enter the name of your device",
      "roomLabel": "Room",
      "saveButton": "Save",
      "updateButton": "Update",
      "alreadyCreatedButton": "Already created",
      "deleteButton": "Delete",
      "status": {
        "notConnected": "Gladys failed to connect to <%= module %> cloud account, please go to ",
        "setupPageLink": "<%= module %> configuration page."
      },
      "device": {
        "title": "Devices in Gladys",
        "search": "Search devices",
        "updates": "Check updates",
        "editButton": "Edit",
        "noDeviceFound": "No <%= module %> device found.",
        "featuresLabel": "Features"
      },
      "discover": {
        "title": "Devices detected on your <%= module %> cloud account",
        "description": "<%= module %> devices are automatically discovered. Your <%= module %> devices need to be added to your <%= module %> cloud account before.",
        "error": "Error discovering <%= module %> devices. Please verify your credentials on Setup.",
        "noDeviceFound": "No <%= module %> device discovered.",
        "scan": "Scan"
      },
      "setup": {
        "title": "<%= module %> configuration",
        "<%= attributeName %>Description": "You can connect Gladys to your <%= module %> cloud account to command the associated devices.",
        "userLabel": "Username",
        "userPlaceholder": "Enter <%= module %> username",
        "passwordLabel": "Password",
        "passwordPlaceholder": "Enter <%= module %> password",
        "saveLabel": "Save configuration",
        "error": "An error occured while saving configuration.",
        "connecting": "Configuration saved. Now connecting to your <%= module %> cloud account...",
        "connected": "Connected to the <%= module %> cloud account with success !",
        "connectionError": "Error while connecting, please check your configuration."
      },
      "error": {
        "defaultError": "There was an error saving the device.",
        "defaultDeletionError": "There was an error deleting the device.",
        "conflictError": "Current device is already in Gladys."
      }
    },