import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';

const EmptyState = ({ id }) => (
  <div class={cx('col-md-12', style.emptyStateDivBox)}>
    <div class="text-center">
      <Text id={id} />
    </div>
  </div>
);

export default EmptyState;
