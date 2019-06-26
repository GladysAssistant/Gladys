import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const EmptyState = ({ children, ...props }) => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <Text id="integration.rtspCamera.noCameraFound" />
    </div>
  </div>
);

export default EmptyState;
