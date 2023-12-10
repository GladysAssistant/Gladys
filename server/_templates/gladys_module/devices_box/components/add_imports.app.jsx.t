---
inject: true
to: ../front/src/components/app.jsx
after: "import <%= className %>SetupPage from '../routes/integration/all/<%= module %>/device-page';"
skip_if: "routes/integration/all/<%= module %>/device-page"
---
import <%= className %>DevicePage from '../routes/integration/all/<%= module %>/device-page';
