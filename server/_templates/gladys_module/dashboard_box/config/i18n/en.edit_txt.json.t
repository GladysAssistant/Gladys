---
inject: true
to: ../front/src/config/i18n/en.json
after: "\"editSceneLabel\": \"Select the scene you want to display here.\""
skip_if: "\"error\": \"Error in service <%= module %>, reboot !\""
---
      },
      "<%= module %>": {
        "editBoxNameLabel": "Enter the name you want to give to the box:",
        "editBoxNamePlaceholder": "Name of the box",
        "error": "Error in service <%= module %>, reboot !"
        