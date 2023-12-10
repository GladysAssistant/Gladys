---
inject: true
to: ../front/src/config/i18n/en.json
after: "\"boxTitle\": {"
skip_if: "\"<%= module %>\": \"<%= className %>\","
---
      "<%= module %>": "<%= className %>",