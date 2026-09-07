import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import get from 'get-value';
import ResetPassword from './ResetPassword';

class ResetPasswordPage extends Component {
  state = {
    password: '',
    passwordRepeat: '',
    twoFactorEnabled: null,
    useRecoveryCode: false,
    success: false,
    resetInProgress: false
  };

  showRecoveryCode = e => {
    e.preventDefault();
    this.setState({ useRecoveryCode: true, invalidRecoveryCode: false });
  };

  showTwoFactorCode = e => {
    e.preventDefault();
    this.setState({ useRecoveryCode: false, invalidRecoveryCode: false });
  };

  resetPassword = async e => {
    e.preventDefault();

    if (this.state.password !== this.state.passwordRepeat) {
      return this.setState({ passwordNotMatching: true });
    }

    if (this.state.password.length < 8) {
      return this.setState({ passwordError: true, passwordNotMatching: false });
    }

    this.setState({
      passwordError: false,
      passwordNotMatching: false,
      errorLink: false,
      invalidRecoveryCode: false,
      resetInProgress: true
    });

    try {
      let user = await this.props.session.gatewayClient.getResetPasswordEmail(this.props.token);
      if (user.two_factor_enabled === true && this.state.twoFactorEnabled === null) {
        this.setState({ twoFactorEnabled: true, resetInProgress: false });
      } else {
        await this.props.session.gatewayClient.resetPassword(
          user.email,
          this.state.password,
          this.props.token,
          this.state.useRecoveryCode ? undefined : this.state.twoFactorCode,
          this.state.useRecoveryCode ? this.state.twoFactorRecoveryCode : undefined
        );
        this.setState({ success: true, resetInProgress: false });
      }
    } catch (e) {
      // A wrong or already used recovery code is rejected by the gateway with a 4xx:
      // it doesn't mean the reset link itself is dead.
      const status = get(e, 'response.status');
      if (this.state.useRecoveryCode && status >= 400 && status < 500) {
        this.setState({ invalidRecoveryCode: true, resetInProgress: false });
      } else {
        this.setState({ errorLink: true, resetInProgress: false });
      }
    }
  };

  render(
    {},
    {
      password,
      success,
      errorLink,
      invalidRecoveryCode,
      twoFactorEnabled,
      passwordRepeat,
      twoFactorCode,
      useRecoveryCode,
      twoFactorRecoveryCode,
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
        invalidRecoveryCode={invalidRecoveryCode}
        passwordError={passwordError}
        passwordNotMatching={passwordNotMatching}
        twoFactorEnabled={twoFactorEnabled}
        twoFactorCode={twoFactorCode}
        updateTwoFactorCode={linkState(this, 'twoFactorCode')}
        useRecoveryCode={useRecoveryCode}
        twoFactorRecoveryCode={twoFactorRecoveryCode}
        updateTwoFactorRecoveryCode={linkState(this, 'twoFactorRecoveryCode')}
        showRecoveryCode={this.showRecoveryCode}
        showTwoFactorCode={this.showTwoFactorCode}
        passwordRepeat={passwordRepeat}
        updatePasswordRepeat={linkState(this, 'passwordRepeat')}
        resetInProgress={resetInProgress}
      />
    );
  }
}

export default connect('session', {})(ResetPasswordPage);
