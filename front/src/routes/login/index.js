import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/login/login';
import LoginPage from './LoginPage';

class Login extends Component {
  componentWillMount() {
    this.props.init(this.props.return_url);
    this.props.checkIfInstanceIsConfigured();
  }

  render({}, {}) {
    return <LoginPage />;
  }
}

export default connect('', actions)(Login);
