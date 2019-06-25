import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/login/login';
import LoginPage from './LoginPage';

@connect(
  '',
  actions
)
class Login extends Component {
  componentWillMount() {
    this.props.checkIfInstanceIsConfigured();
  }

  render({}, {}) {
    return <LoginPage />;
  }
}

export default Login;
