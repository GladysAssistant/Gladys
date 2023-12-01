import { MarkupText } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const EmptyState = ({}) => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <MarkupText id="integration.sonos.discover.noDeviceFound" />
    </div>
  </div>
);

export default EmptyState;
