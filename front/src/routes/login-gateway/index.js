import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/login/loginGateway';
import LoginGatewayPage from './LoginGatewayPage';

class Login extends Component {
  componentWillMount() {
    this.props.init(this.props.return_url);
  }

  render(props, {}) {
    return <LoginGatewayPage {...props} />;
  }
}

export default connect(
  // the fields of the phone layout are controlled: the page reads what was typed, or a
  // re-render (a refusal, a request in flight) would empty them on screen
  'gatewayLoginEmail,gatewayLoginPassword,gatewayLoginTwoFactorCode,gatewayLoginStep2,gatewayLoginStatus,gatewayLoginError,gatewayTwoFactorJustEnabled,gatewayLoginUseRecoveryCode,gatewayLoginRecoveryCode,gatewayLoginRecoveryCodes,gatewayLoginRecoveryCodesStatus,gatewayLoginRecoveryCodesTwoFactorCode,gatewayLoginRecoveryCodesWrongTwoFactorCode,gatewayLoginTwoFactorResetStatus,gatewayLoginTwoFactorResetError',
  actions
)(Login);
