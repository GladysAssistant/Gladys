import { Text } from 'preact-i18n';
import cx from 'classnames';

const EmptyState = ({}) => (
  <div class="col-md-12">
    <div class={cx('text-center')}>
      <Text id="integration.androidTV.noAndroidTVFound" />
    </div>
  </div>
);

export default EmptyState;
