---
inject: true
to: ./utils/constants.js
after: "const DASHBOARD_BOX_TYPE = {"
skip_if: "<%= constName %>: '<%= module %>',"
---
const DASHBOARD_BOX_TYPE = {
  <%= constName %>: '<%= module %>',