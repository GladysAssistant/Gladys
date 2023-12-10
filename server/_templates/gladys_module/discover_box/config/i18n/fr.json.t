---
inject: true
to: ../front/src/config/i18n/fr.json
after: "\"boxTitle\": {"
skip_if: "\"<%= module %>\": \"<%= className %>\","
---
      "<%= module %>": "<%= className %>",