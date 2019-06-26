import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ForgotPasswordPage from './ForgotPasswordPage';
import actions from '../../actions/forgotPassword';

@connect(
  'forgotPasswordStatus,forgotPasswordEmail',
  actions
)
class ForgotPassword extends Component {
  render(props, {}) {
    return <ForgotPasswordPage {...props} />;
  }
}

export default ForgotPassword;
