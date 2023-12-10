---
inject: true
to: ../front/src/config/i18n/fr.json
after: "\"editSceneLabel\": \"Sélectionnez la scène que vous souhaitez afficher ici.\""
skip_if: "\"error\": \"Error in service <%= module %>, reboot !\""
---
      },
      "<%= module %>": {
        "editBoxNameLabel": "Enter the name you want to give to the box:",
        "editBoxNamePlaceholder": "Name of the box",
        "error": "Error in service <%= module %>, reboot !"