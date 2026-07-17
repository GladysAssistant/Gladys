import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';

const GatewayPage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="signup.restoreBackupInProgress.title" />
      </h2>
    </div>
    <div class="card-body">
      {!props.gatewayRestoreErrored && (
        <div>
          <p>
            <Text id="signup.restoreBackupInProgress.description" />
          </p>
          <div class="dimmer active">
            <div class="loader" />
            <div class="dimmer-content">
              <div style={{ height: '10rem' }} />
            </div>
          </div>
        </div>
      )}
      {props.gatewayRestoreErrored && (
        <div>
          <div class="alert alert-danger">
            <Text id="signup.restoreBackupInProgress.errored" />
          </div>
          <p>
            <Text id="signup.restoreBackupInProgress.erroredHelp" />
          </p>
          <div class="btn btn-primary btn-block" onClick={props.changeStepToUpdateRestoreKey}>
            <Text id="signup.restoreBackupInProgress.updateRestoreKeyButton" />
          </div>
          <Link href="/signup/create-account-local" class="btn btn-secondary btn-block">
            <Text id="signup.restoreBackupInProgress.createLocalAccountButton" />
          </Link>
        </div>
      )}
    </div>
  </div>
);

export default GatewayPage;
