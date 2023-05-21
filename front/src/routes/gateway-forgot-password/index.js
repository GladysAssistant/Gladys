import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import ForgotPassword from './ForgotPassword';

class ForgotPasswordPage extends Component {
  sendResetPasswordLink = async e => {
    e.preventDefault();
    this.setState({ forgotInProgress: true });

    try {
      await this.props.session.gatewayClient.forgotPassword(this.state.email);
      this.setState({ success: true, forgotInProgress: false });
    } catch (e) {
      console.error(e);
      this.setState({ success: true, forgotInProgress: false });
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      email: '',
      forgotInProgress: false
    };
  }

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
