import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

const EmptyState = () => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <Text id="integration.tasmota.device.noDeviceFound" />

      <div class="mt-5">
        <Link href="/dashboard/integration/device/tasmota/mqtt">
          <button class="btn btn-outline-primary ml-2">
            <Text id="integration.tasmota.mqttDiscoverTab" /> <i class="icon icon-radio" />
          </button>
        </Link>
        <Link href="/dashboard/integration/device/tasmota/http">
          <button class="btn btn-outline-primary ml-2">
            <Text id="integration.tasmota.httpDiscoverTab" /> <i class="icon icon-globe" />
          </button>
        </Link>
      </div>
    </div>
  </div>
);

export default EmptyState;
