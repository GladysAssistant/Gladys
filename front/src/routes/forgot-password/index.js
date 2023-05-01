import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ForgotPasswordPage from './ForgotPasswordPage';
import actions from '../../actions/forgotPassword';

class ForgotPassword extends Component {
  render(props, {}) {
    return <ForgotPasswordPage {...props} />;
  }
}

export default connect('forgotPasswordStatus,forgotPasswordEmail', actions)(ForgotPassword);
