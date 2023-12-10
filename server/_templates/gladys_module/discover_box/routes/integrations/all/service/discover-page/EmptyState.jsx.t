---
to: ../front/src/routes/integration/all/<%= module %>/discover-page/EmptyState.jsx
---
import { MarkupText } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const EmptyState = ({}) => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <MarkupText id="integration.<%= module %>.discover.noDeviceFound" />
    </div>
  </div>
);

export default EmptyState;