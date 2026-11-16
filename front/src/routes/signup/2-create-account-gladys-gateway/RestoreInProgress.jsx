import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { MobileNotice, BigButton, kitStyle } from '../../../components/mobile';
import style from '../style.css';

const MobileRestoreInProgress = props => (
  <div data-cy="signup-restore-progress-mobile">
    <h1 class={kitStyle.largeTitle}>
      <Text id="signup.restoreBackupInProgress.title" />
    </h1>
    {!props.gatewayRestoreErrored && (
      <div>
        <p class={kitStyle.lead}>
          <Text id="signup.restoreBackupInProgress.description" />
        </p>
        <div class={style.mobileSpinner} role="status">
          <div class="loader" />
        </div>
      </div>
    )}
    {props.gatewayRestoreErrored && (
      <div>
        <MobileNotice tone="danger" icon="alert-circle" role="alert">
          <Text id="signup.restoreBackupInProgress.errored" />
        </MobileNotice>
        <p class={kitStyle.lead}>
          <Text id="signup.restoreBackupInProgress.erroredHelp" />
        </p>
        <div class={kitStyle.buttons}>
          <BigButton variant="primary" onClick={props.changeStepToUpdateRestoreKey}>
            <Text id="signup.restoreBackupInProgress.updateRestoreKeyButton" />
          </BigButton>
          <BigButton href="/signup/create-account-local">
            <Text id="signup.restoreBackupInProgress.createLocalAccountButton" />
          </BigButton>
        </div>
      </div>
    )}
  </div>
);

const DesktopRestoreInProgress = ({ children, ...props }) => (
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
          <button class="btn btn-primary btn-block" onClick={props.changeStepToUpdateRestoreKey}>
            <Text id="signup.restoreBackupInProgress.updateRestoreKeyButton" />
          </button>
          <Link href="/signup/create-account-local" class="btn btn-secondary btn-block">
            <Text id="signup.restoreBackupInProgress.createLocalAccountButton" />
          </Link>
        </div>
      )}
    </div>
  </div>
);

const GatewayPage = props =>
  props.mobile ? <MobileRestoreInProgress {...props} /> : <DesktopRestoreInProgress {...props} />;

export default GatewayPage;
