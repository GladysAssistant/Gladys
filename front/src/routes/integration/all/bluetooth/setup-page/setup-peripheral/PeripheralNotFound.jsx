import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const PeripheralNotFound = ({}) => (
  <div>
    <div class="alert alert-danger">
      <Text id={'integration.bluetooth.discover.peripheral.notAvailable'} />
    </div>
    <Link href="/dashboard/integration/device/bluetooth/setup">
      <button type="button" class="btn btn-outline-secondary btn-sm">
        <Text id="global.backButton" />
      </button>
    </Link>
  </div>
);

export default PeripheralNotFound;
