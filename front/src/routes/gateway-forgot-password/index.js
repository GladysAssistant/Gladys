import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import ForgotPassword from './ForgotPassword';
import { cleanEmail } from '../../utils/validator';

class ForgotPasswordPage extends Component {
  state = {
    email: '',
    forgotInProgress: false
  };

  sendResetPasswordLink = e => {
    e.preventDefault();
    this.setState({ forgotInProgress: true });
    this.props.session.gatewayClient
      .forgotPassword(cleanEmail(this.state.email).toLowerCase())
      .then(() => this.setState({ success: true, forgotInProgress: false }))
      .catch(e => {
        console.error(e);
        this.setState({ success: true, forgotInProgress: false });
      });
  };

  render({}, { email, success, forgotInProgress }) {
    return (
      <ForgotPassword
        email={email}
        updateEmail={linkState(this, 'email')}
        sendResetPasswordLink={this.sendResetPasswordLink}
        success={success}
        forgotInProgress={forgotInProgress}
      />
    );
  }
}

export default connect('session', {})(ForgotPasswordPage);
