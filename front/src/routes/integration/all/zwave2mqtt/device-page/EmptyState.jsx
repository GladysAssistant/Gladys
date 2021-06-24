import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

const EmptyState = () => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <Text id="integration.zwave2mqtt.device.noDeviceFound" />

      <div class="mt-5">
        <Link href="/dashboard/integration/device/zwave2mqtt/discover">
          <button class="btn btn-outline-primary ml-2">
            <Text id="integration.zwave2mqtt.mqttDiscoverTab" /> <i class="fe fe-globe" />
          </button>
        </Link>
      </div>
    </div>
  </div>
);

export default EmptyState;
