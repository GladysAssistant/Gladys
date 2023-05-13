import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import ResetPassword from './ResetPassword';

class ResetPasswordPage extends Component {
  state = {
    password: '',
    passwordRepeat: '',
    twoFactorEnabled: null,
    success: false,
    resetInProgress: false
  };

  resetPassword = async e => {
    e.preventDefault();

    if (this.state.password !== this.state.passwordRepeat) {
      return this.setState({ passwordNotMatching: true });
    }

    if (this.state.password.length < 8) {
      return this.setState({ passwordError: true, passwordNotMatching: false });
    }

    this.setState({ passwordError: false, passwordNotMatching: false, resetInProgress: true });

    try {
      let user = await this.props.session.gatewayClient.getResetPasswordEmail(this.props.token);
      if (user.two_factor_enabled === true && this.state.twoFactorEnabled === null) {
        this.setState({ twoFactorEnabled: true, resetInProgress: false });
      } else {
        await this.props.session.gatewayClient.resetPassword(
          user.email,
          this.state.password,
          this.props.token,
          this.state.twoFactorCode
        );
        this.setState({ success: true, resetInProgress: false });
      }
    } catch (e) {
      this.setState({ errorLink: true, resetInProgress: false });
    }
  };

  render(
    {},
    {
      password,
      success,
      errorLink,
      twoFactorEnabled,
      passwordRepeat,
      twoFactorCode,
      passwordError,
      passwordNotMatching,
      resetInProgress
    }
  ) {
    return (
      <ResetPassword
        password={password}
        updatePassword={linkState(this, 'password')}
        resetPassword={this.resetPassword}
        success={success}
        errorLink={errorLink}
        passwordError={passwordError}
        passwordNotMatching={passwordNotMatching}
        twoFactorEnabled={twoFactorEnabled}
        twoFactorCode={twoFactorCode}
        updateTwoFactorCode={linkState(this, 'twoFactorCode')}
        passwordRepeat={passwordRepeat}
        updatePasswordRepeat={linkState(this, 'passwordRepeat')}
        resetInProgress={resetInProgress}
      />
    );
  }
}

export default connect('session', {})(ResetPasswordPage);
