---
inject: true
to: ../front/src/routes/dashboard/edit-dashboard/EditBox.jsx
after: "return <EditClock {...props} />;"
skip_if: "case '<%= module %>':"
---
    case '<%= module %>':
      return <Edit<%= className %>Box {...props} />;