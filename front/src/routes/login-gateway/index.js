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

export default connect('gatewayLoginStep2,gatewayLoginStatus', actions)(Login);
