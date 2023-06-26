---
inject: true
to: ../front/src/config/integrations/devices.json
after: "\"img\": \"/assets/integrations/cover/broadlink.jpg\""
skip_if: "\"key\": \"<%= module %>\""
sh: "cp <%= templates %>/gladys_module/box/config/integrations/gladys_toolbox.png ../front/src/assets/integrations/cover/<%= module %>.png"
---
  },
  {
    "key": "<%= module %>",
    "link": "<%= module %>",
    "img": "/assets/integrations/cover/<%= module %>.png"