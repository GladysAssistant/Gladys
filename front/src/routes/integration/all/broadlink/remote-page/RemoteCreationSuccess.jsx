import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const RemoteCreationSuccess = () => {
  return (
    <div>
      <div class="alert alert-success">
        <Text id="integration.broadlink.setup.saveSuccess" />
      </div>

      <Link href="/dashboard/integration/device/broadlink">
        <button type="button" class="btn btn-outline-success btn-sm">
          <Text id="integration.broadlink.setup.successLabel" />
        </button>
      </Link>
    </div>
  );
};

export default RemoteCreationSuccess;
