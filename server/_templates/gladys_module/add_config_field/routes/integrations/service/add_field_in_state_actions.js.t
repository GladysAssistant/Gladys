---
inject: true
to: ../front/src/routes/integration/all/<%= module %>/actions.js
after: "store.setState({"
skip_if: "<%= attributeName %><%= fieldClassName %>: configuration.<%= fieldAttributeName %>"
---
          <%= attributeName %><%= fieldClassName %>: configuration.<%= fieldAttributeName %>,