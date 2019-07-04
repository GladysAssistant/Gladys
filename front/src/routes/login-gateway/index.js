import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/login/loginGateway';
import LoginGatewayPage from './LoginGatewayPage';

@connect(
  'gatewayLoginStep2,gatewayLoginStatus',
  actions
)
class Login extends Component {
  componentWillMount() {
    this.props.init();
  }

  render(props, {}) {
    return <LoginGatewayPage {...props} />;
  }
}

export default Login;
