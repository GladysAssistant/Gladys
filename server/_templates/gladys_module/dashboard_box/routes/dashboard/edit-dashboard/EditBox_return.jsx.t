---
inject: true
to: ../front/src/routes/dashboard/edit-dashboard/EditBox.jsx
after: "return <EditClock {...props} />;"
skip_if: "import <%= className %>Box from '../../components/boxs/<%= module %>/<%= className %>Box';"
---
    case '<%= module %>':
      return <Edit<%= className %>Box {...props} />;