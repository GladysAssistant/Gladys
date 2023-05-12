import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import get from 'get-value';
import actions from '../../../actions/gateway';
import GatewayLoginForm from '../../../components/gateway/GatewayLoginForm';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import RestoreBackup from './RestoreBackup';
import SetRestoreKey from './SetRestoreKey';
import RestoreInProgress from './RestoreInProgress';
import linkState from 'linkstate';

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
      this.setState({ loading: false, step: 3 });
    } catch (e) {
      this.setState({ loading: false, error: true });
    }
  };
  restoreBackup = async fileUrl => {
    await this.setState({
      step: 4,
      gatewayRestoreErrored: false
    });
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
      const status = get(e, 'response.status');
      if (status === 401) {
        window.location = '/dashboard';
      } else {
        setTimeout(() => this.getRestoreStatus(), 1000);
      }
    }
  };
  isGladysPlusConnected = async () => {
    try {
      const gatewayStatus = await this.props.httpClient.get('/api/v1/gateway/status');
      if (gatewayStatus.configured) {
        this.setState({ step: 2 });
      }
    } catch (e) {}
  };
  changeStepToUpdateRestoreKey = () => {
    this.setState({ step: 2 });
  };
  async componentDidMount() {
    await this.props.session.init();
    this.props.getBackups();
    this.isGladysPlusConnected();
  }

  componentDidUpdate() {
    if (this.props.displayConnectedSuccess && this.state.step === 1) {
      this.changeStepToUpdateRestoreKey();
    }
  }
  render() {
    const { step, backupKey, loading, error, gatewayRestoreErrored } = this.state;
    return (
      <div class="page">
        <div class="page-single mt-6">
          <div class="container">
            <div class="row">
              {step === 1 && (
                <div class="col col-login mx-auto">
                  <Link href="/signup" class="btn btn-secondary btn-sm mb-4 mt-6">
                    <Text id="global.backButton" />
                  </Link>

                  <GatewayLoginForm {...this.props} external_forgot_password login={this.login} />
                </div>
              )}
              {step === 2 && (
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
              {step === 3 && !this.props.gatewayRestoreInProgress && (
                <div class="col-md-6 mx-auto">
                  <RestoreBackup {...this.props} restoreBackup={this.restoreBackup} />
                </div>
              )}
              {step === 4 && (
                <div class="col-md-4 mx-auto">
                  <RestoreInProgress
                    gatewayRestoreErrored={gatewayRestoreErrored}
                    changeStepToUpdateRestoreKey={this.changeStepToUpdateRestoreKey}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  'user,session,httpClient,gatewayBackups,gatewayStatus,gatewayLoginEmail,gatewayLoginPassword,gatewayLoginTwoFactorCode,gatewayGetStatusStatus,displayGatewayLogin,gatewayLoginStatus,gatewayLoginStep2,gatewayUsersKeys,gatewayInstanceKeys,gatewayGetKeysStatus,gatewayDisconnectStatus,gatewayBackupKey,gatewaySaveBackupKeyStatus,displayConnectedSuccess',
  actions
)(CreateAccountGladysGateway);
