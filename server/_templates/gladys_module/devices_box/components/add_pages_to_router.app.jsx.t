---
inject: true
to: ../front/src/components/app.jsx
before: "<<%= className %>SetupPage path=\"/dashboard/integration/device/<%= module %>/setup\" />"
skip_if: "<<%= className %>SetupPage path=\"/dashboard/integration/device/<%= module %>/discover\" />"
---
        <<%= className %>SetupPage path="/dashboard/integration/device/<%= module %>/discover" />
        