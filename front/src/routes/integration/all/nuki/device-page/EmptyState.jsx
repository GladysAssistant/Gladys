import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';

const EmptyState = () => (
  <div class="col-md-12">
    <div class={cx('text-center', style.emptyStateDivBox)}>
      <Text id="integration.nuki.device.noDeviceFound" />

      <div class="mt-5">
      
        <Link href="/dashboard/integration/device/nuki/mqtt">
          <button class="btn btn-outline-primary ml-2">
            <Text id="integration.nuki.mqttDiscoverTab" /> <i class="fe fe-radio" />
          </button>
        </Link>

        <Link href="/dashboard/integration/device/nuki/http">
          <button class="btn btn-outline-primary ml-2">
            <Text id="integration.nuki.httpDiscoverTab" /> <i class="fe fe-radio" />
          </button>
        </Link>
      
      </div>
    </div>
  </div>
);

export default EmptyState;
