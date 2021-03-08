import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const ConfigurePeripheralSuccess = () => {
  return (
    <div>
      <div class="alert alert-success">
        <Text id="integration.bluetooth.discover.saveSuccess" />
      </div>

      <Link href="/dashboard/integration/device/bluetooth/setup">
        <button type="button" class="btn btn-outline-success btn-sm">
          <Text id="integration.bluetooth.discover.peripheral.successLabel" />
        </button>
      </Link>
    </div>
  );
};

export default ConfigurePeripheralSuccess;
