---
inject: true
to: ./utils/constants.js
before: "BROADLINK: {"
skip_if: "<%= constName %>: {"
---
  <%= constName %>: {
      CONNECTED: '<%= attributeName %>.connected',
      NEW_DEVICE: '<%= attributeName %>.new-device',
      ERROR: '<%= attributeName %>.error',
  },
