---
inject: true
to: ../front/src/routes/dashboard/edit-dashboard/EditBox.jsx
after: "import EditClock from '../../../components/boxs/clock/EditClock';"
skip_if: "import Edit<%= className %>Box from '../../../components/boxs/<%= module %>/Edit<%= className %>Box';"
---
import Edit<%= className %>Box from '../../../components/boxs/<%= module %>/Edit<%= className %>Box';
