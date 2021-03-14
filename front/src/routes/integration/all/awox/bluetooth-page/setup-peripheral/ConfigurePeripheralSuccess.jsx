import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const ConfigurePeripheralSuccess = () => {
  return (
    <div>
      <div class="alert alert-success">
        <Text id="integration.awox.setup.saveSuccess" />
      </div>

      <Link href="/dashboard/integration/device/awox/bluetooth">
        <button type="button" class="btn btn-outline-success btn-sm">
          <Text id="integration.awox.setup.peripheral.successLabel" />
        </button>
      </Link>
    </div>
  );
};

export default ConfigurePeripheralSuccess;
