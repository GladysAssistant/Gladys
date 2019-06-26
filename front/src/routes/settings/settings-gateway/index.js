import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GatewayPage from './GatewayPage';
import actions from '../../../actions/gateway';

@connect(
  'gatewayStatus,gatewayLoginEmail,gatewayLoginPassword,gatewayLoginTwoFactorCode,gatewayGetStatusStatus,displayGatewayLogin,gatewayLoginStatus,gatewayLoginStep2,gatewayUsersKeys,gatewayInstanceKeys,gatewayGetKeysStatus',
  actions
)
class SettingsGateway extends Component {
  componentWillMount() {
    this.props.cancelGatewayLogin();
    this.props.getStatus();
    this.props.getKeys();
    this.props.getInstanceKeys();
  }

  render(props, {}) {
    return <GatewayPage {...props} />;
  }
}

export default SettingsGateway;
