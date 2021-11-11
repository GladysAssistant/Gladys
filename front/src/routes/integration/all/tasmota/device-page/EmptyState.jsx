import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import EmptyDeviceList from '../../../../../components/device/view/EmptyDeviceList';

const EmptyState = () => (
  <EmptyDeviceList>
    <Text id="integration.tasmota.device.noDeviceFound" />
    <div class="mt-5">
      <Link href="/dashboard/integration/device/tasmota/mqtt">
        <button class="btn btn-outline-primary ml-2">
          <Text id="integration.tasmota.mqttDiscoverTab" /> <i class="fe fe-radio" />
        </button>
      </Link>
      <Link href="/dashboard/integration/device/tasmota/http">
        <button class="btn btn-outline-primary ml-2">
          <Text id="integration.tasmota.httpDiscoverTab" /> <i class="fe fe-globe" />
        </button>
      </Link>
    </div>
  </EmptyDeviceList>
);

export default EmptyState;
