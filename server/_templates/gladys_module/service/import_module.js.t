---
inject: true
to: ./services/index.js
append: true
skip_if: module.exports.<%= module %> = require('./<%= module %>')
---
module.exports.<%= module %> = require('./<%= module %>');