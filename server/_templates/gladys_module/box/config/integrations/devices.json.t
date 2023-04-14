---
inject: true
to: ../front/src/config/integrations/devices.json
after: "\"img\": \"/assets/integrations/cover/broadlink.jpg\""
skip_if: "\"key\": \"<%= module %>\""
---
  },
  {
    "key": "<%= module %>",
    "link": "<%= module %>",
    "img": "/assets/integrations/cover/<%= module %>.jpg"
