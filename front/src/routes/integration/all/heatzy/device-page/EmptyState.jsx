import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const EmptyState = () => (
  <div class="col-md-12">
    <div class="text-center">
      <Text id="integration.heatzy.device.noDevices" />
    </div>
  </div>
);

export default EmptyState;
