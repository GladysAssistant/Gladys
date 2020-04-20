import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import actions from '../../../actions/gateway';
import GatewayLoginForm from '../../../components/gateway/GatewayLoginForm';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import RestoreBackup from './RestoreBackup';
import SetRestoreKey from './SetRestoreKey';
import RestoreInProgress from './RestoreInProgress';
import linkState from 'linkstate';

@connect(
  'user,session,httpClient,gatewayBackups,gatewayStatus,gatewayLoginEmail,gatewayLoginPassword,gatewayLoginTwoFactorCode,gatewayGetStatusStatus,displayGatewayLogin,gatewayLoginStatus,gatewayLoginStep2,gatewayUsersKeys,gatewayInstanceKeys,gatewayGetKeysStatus,gatewayDisconnectStatus,gatewayBackupKey,gatewaySaveBackupKeyStatus,displayConnectedSuccess',
  actions
)
class CreateAccountGladysGateway extends Component {
  state = {
    step: 1,
    backupKey: ''
  };
  login = async e => {
    e.preventDefault();
    await this.props.tempSignupForRestore(this.props.user.language);
    await this.props.login(e);
  };
  saveBackupKey = async () => {
    await this.setState({ loading: true, error: false });
    try {
      await this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_KEY}`, {
        value: this.state.backupKey
      });
      await this.props.getBackups();
      this.setState({ loading: false, step: 2 });
    } catch (e) {
      this.setState({ loading: false, error: true });
    }
  };
  restoreBackup = async fileUrl => {
    await this.setState({ step: 3 });
    try {
      this.props.httpClient.post('/api/v1/gateway/backup/restore', {
        file_url: fileUrl
      });
      this.getRestoreStatus();
    } catch (e) {
      await this.setState({ restoreFailed: true });
    }
  };
  getRestoreStatus = async () => {
    try {
      const restoreStatus = await this.props.httpClient.get('/api/v1/gateway/backup/restore/status');

      if (restoreStatus.restore_in_progress) {
        setTimeout(() => this.getRestoreStatus(), 1000);
      } else if (restoreStatus.restore_errored) {
        this.setState({
          gatewayRestoreErrored: true
        });
      } else {
        window.location = '/dashboard';
      }
    } catch (e) {
      setTimeout(() => this.getRestoreStatus(), 1000);
    }
  };
  async componentDidMount() {
    await this.props.session.init();
    this.props.getBackups();
  }
  render() {
    const { step, backupKey, loading, error, gatewayRestoreErrored } = this.state;
    return (
      <div class="page">
        <div class="page-single mt-6">
          <div class="container">
            <div class="row">
              {this.props.displayConnectedSuccess && (
                <div class="col col-login mx-auto">
                  <Link href="/signup" class="btn btn-secondary btn-sm mb-4 mt-6">
                    ◀️️ <Text id="signup.createLocalAccount.backButton" />
                  </Link>

                  <GatewayLoginForm {...this.props} external_forgot_password login={this.login} />
                </div>
              )}
              {!this.props.displayConnectedSuccess && step === 1 && (
                <div class="col col-login mx-auto">
                  <SetRestoreKey
                    {...this.props}
                    backupKey={backupKey}
                    loading={loading}
                    error={error}
                    updateBackupKey={linkState(this, 'backupKey')}
                    saveBackupKey={this.saveBackupKey}
                  />
                </div>
              )}
              {!this.props.displayConnectedSuccess && step === 2 && !this.props.gatewayRestoreInProgress && (
                <RestoreBackup {...this.props} restoreBackup={this.restoreBackup} />
              )}
              {step === 3 && <RestoreInProgress gatewayRestoreErrored={gatewayRestoreErrored} />}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateAccountGladysGateway;
