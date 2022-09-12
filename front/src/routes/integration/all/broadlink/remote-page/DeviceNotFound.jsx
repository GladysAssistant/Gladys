import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const DeviceNotFound = () => (
  <div>
    <div class="alert alert-danger">
      <Text id={'integration.broadlink.setup.notFound'} />
    </div>
    <Link href="/dashboard/integration/device/broadlink">
      <button type="button" class="btn btn-outline-secondary btn-sm">
        <Text id="global.backButton" />
      </button>
    </Link>
  </div>
);

export default DeviceNotFound;
