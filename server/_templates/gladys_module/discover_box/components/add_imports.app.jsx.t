---
inject: true
to: ../front/src/components/app.jsx
after: "import <%= className %>SetupPage from '../routes/integration/all/<%= module %>/setup-page';"
skip_if: "routes/integration/all/<%= module %>/discover-page"
---
import <%= className %>DiscoverPage from '../routes/integration/all/<%= module %>/discover-page';
