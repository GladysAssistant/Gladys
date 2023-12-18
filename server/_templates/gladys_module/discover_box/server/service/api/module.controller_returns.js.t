---
inject: true
to: "./services/<%= module %>/api/<%= module %>.controller.js"
before: "'get /api/v1/service/<%= module %>/status': {"
skip_if: "'get /api/v1/service/<%= module %>/discover': {"
---
    'get /api/v1/service/<%= module %>/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },