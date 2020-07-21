import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GatewayPage from './GatewayPage';
import actions from '../../../actions/gateway';

@connect(
  'user,gatewayStatus,gatewayLoginEmail,gatewayLoginPassword,gatewayLoginTwoFactorCode,gatewayGetStatusStatus,displayGatewayLogin,gatewayLoginStatus,gatewayLoginStep2,gatewayUsersKeys,gatewayInstanceKeys,gatewayGetKeysStatus,gatewayDisconnectStatus,gatewayBackupKey,gatewaySaveBackupKeyStatus,displayConnectedSuccess',
  actions
)
class SettingsGateway extends Component {
  componentWillMount() {
    this.props.cancelGatewayLogin();
    this.props.getStatus();
    this.props.getKeys();
    this.props.getInstanceKeys();
    this.props.getBackupKey();
  }

  render(props, {}) {
    return <GatewayPage {...props} />;
  }
}

export default SettingsGateway;
