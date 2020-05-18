import { Text } from 'preact-i18n';

const GatewayPage = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h2 class="page-title">
        <Text id="signup.restoreBackupInProgress.title" />
      </h2>
    </div>
    <div class="card-body">
      <p>
        <Text id="signup.restoreBackupInProgress.description" />
      </p>
      {!props.gatewayRestoreErrored && (
        <div class="dimmer active">
          <div class="loader" />
          <div class="dimmer-content">
            <div style={{ height: '10rem' }} />
          </div>
        </div>
      )}
      {props.gatewayRestoreErrored && (
        <div>
          <div class="alert alert-danger">
            <Text id="signup.restoreBackupInProgress.errored" />
          </div>
          <div class="btn btn-primary" onClick={props.changeStepToUpdateRestoreKey}>
            <Text id="signup.restoreBackupInProgress.updateRestoreKeyButton" />
          </div>
        </div>
      )}
    </div>
  </div>
);

export default GatewayPage;
