---
inject: true
to: ../front/src/routes/dashboard/Box.jsx
after: "import SceneBox from '../../components/boxs/scene/SceneBox';"
skip_if: "import <%= className %>Box from '../../components/boxs/<%= module %>/<%= className %>Box';"
---
import <%= className %>Box from '../../components/boxs/<%= module %>/<%= className %>Box';

