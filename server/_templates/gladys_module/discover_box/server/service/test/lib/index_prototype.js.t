---
inject: true
to: ./services/<%= module %>/lib/index.js
after: "<%= attributeName %>Handler.prototype.getStatus = getStatus;"
skip_if: "// DEVICE"
---

// DEVICE
<%= attributeName %>Handler.prototype.discover = discover;