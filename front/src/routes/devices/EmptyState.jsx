import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

const EmptyState = ({}) => (
  <div class={cx('text-center', style.emptyStateDivBox)}>
    <i class={cx('fe', 'fe-toggle-right', style.emptyStateIcon)} />
    <p class={style.emptyStateText}>
      <Text id="devicesList.emptyState" />
    </p>
    <Link href="/dashboard/integration/device" class="btn btn-outline-primary">
      <Text id="devicesList.emptyStateButton" />
    </Link>
  </div>
);

export default EmptyState;
