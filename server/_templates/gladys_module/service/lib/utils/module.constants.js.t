---
to: ./services/<%= module %>/lib/utils/<%= module %>.constants.js
---
const CONFIGURATION = {
  <%= constName %>_LOGIN_KEY: '<%= constName %>_LOGIN',
  <%= constName %>_PASSWORD_KEY: '<%= constName %>_PASSWORD',
};

const DEVICE_EXTERNAL_ID_BASE = '<%= module %>';

module.exports = {
  DEVICE_EXTERNAL_ID_BASE,
  CONFIGURATION,
};
