---
inject: true
to: ./services/<%= module %>/lib/index.js
after: "const { getStatus }"
skip_if: "'./device/<%= module %>.discover'"
---
const { discover } = require('./device/<%= module %>.discover');
