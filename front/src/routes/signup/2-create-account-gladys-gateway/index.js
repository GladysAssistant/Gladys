import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import actions from '../../../actions/gateway';
import GatewayLoginForm from '../../../components/gateway/GatewayLoginForm';

@connect(
  'user,session,gatewayStatus,gatewayLoginEmail,gatewayLoginPassword,gatewayLoginTwoFactorCode,gatewayGetStatusStatus,displayGatewayLogin,gatewayLoginStatus,gatewayLoginStep2,gatewayUsersKeys,gatewayInstanceKeys,gatewayGetKeysStatus,gatewayDisconnectStatus,gatewayBackupKey,gatewaySaveBackupKeyStatus,displayConnectedSuccess',
  actions
)
class CreateAccountGladysGateway extends Component {
  login = async e => {
    e.preventDefault();
    await this.props.tempSignupForRestore(this.props.user.language);
    await this.props.login(e);
  };
  render() {
    return (
      <div class="page">
        <div class="page-single mt-6">
          <div class="container">
            <div class="row">
              <div class="col col-login mx-auto">
                {!this.props.user.id && (
                  <Link href="/signup" class="btn btn-secondary btn-sm mb-4 mt-6">
                    ◀️️ <Text id="signup.createLocalAccount.backButton" />
                  </Link>
                )}
                {!this.props.displayConnectedSuccess && (
                  <GatewayLoginForm {...this.props} external_forgot_password login={this.login} />
                )}
                {this.props.displayConnectedSuccess && <RestoreBackup />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateAccountGladysGateway;
