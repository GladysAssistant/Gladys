import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import get from 'get-value';
import ResetPassword from './ResetPassword';
import { RequestStatus } from '../../utils/consts';

class ResetPasswordPage extends Component {
  state = {
    password: '',
    passwordRepeat: '',
    // null until the reset link is read: the fields of the second factor show from the start,
    // not after a first submit that looked like it saved the password
    twoFactorEnabled: null,
    twoFactorResetDone: false,
    useRecoveryCode: false,
    success: false,
    resetInProgress: false,
    twoFactorResetStatus: null,
    twoFactorResetError: null
  };

  componentDidMount() {
    this.loadResetPasswordUser();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  loadResetPasswordUser = async () => {
    if (!this.props.token) {
      this.setState({ errorLink: true });
      return;
    }
    try {
      const user = await this.props.session.gatewayClient.getResetPasswordEmail(this.props.token);
      this.setState({ twoFactorEnabled: user.two_factor_enabled === true });
    } catch (e) {
      this.setState({ errorLink: true });
    }
  };

  // Back on this tab after resetting the two-factor authentication from the emailed link:
  // the code is no longer asked, the user only chooses the new password
  onVisibilityChange = async () => {
    if (
      document.visibilityState !== 'visible' ||
      this.state.twoFactorResetStatus !== RequestStatus.Success ||
      this.state.twoFactorEnabled !== true
    ) {
      return;
    }
    try {
      const user = await this.props.session.gatewayClient.getResetPasswordEmail(this.props.token);
      if (user.two_factor_enabled !== true) {
        this.setState({ twoFactorEnabled: false, twoFactorResetDone: true, useRecoveryCode: false });
      }
    } catch (e) {
      // the submit tells the user if the link is dead
    }
  };

  // The user forgot their password AND lost their two-factor app and recovery codes,
  // with no Gladys connected to Gladys Plus: the reset password link proves the mailbox,
  // Gladys Plus emails a link that resets their two-factor authentication.
  requestTwoFactorReset = async e => {
    e.preventDefault();
    if (
      this.state.twoFactorResetStatus === RequestStatus.Getting ||
      this.state.twoFactorResetStatus === RequestStatus.Success
    ) {
      return;
    }
    this.setState({ twoFactorResetStatus: RequestStatus.Getting, twoFactorResetError: null });
    try {
      await this.props.session.gatewayClient.requestTwoFactorResetFromPasswordReset(this.props.token);
      this.setState({ twoFactorResetStatus: RequestStatus.Success });
    } catch (e) {
      const status = get(e, 'response.status');
      // the request carries the reset password token: never the whole error in the console
      console.error('Could not request the two factor reset', status || e.message);
      const errorMessage = get(e, 'response.data.error_message');
      let error = 'UNKNOWN';
      if (errorMessage === 'INSTANCE_CONNECTED') {
        error = 'INSTANCE_CONNECTED';
      } else if (status === 429) {
        error = 'TOO_MANY';
      } else if (status === 404) {
        error = 'LINK';
      }
      this.setState({ twoFactorResetStatus: RequestStatus.Error, twoFactorResetError: error });
    }
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
      invalidTwoFactorCode: false,
      tooManyTwoFactorAttempts: false,
      resetInProgress: true
    });

    try {
      const user = await this.props.session.gatewayClient.getResetPasswordEmail(this.props.token);
      const twoFactorEnabled = user.two_factor_enabled === true;
      if (twoFactorEnabled && this.state.twoFactorEnabled !== true) {
        // the code was not asked yet (two-factor enabled since the page was loaded)
        this.setState({ twoFactorEnabled: true, twoFactorResetDone: false, resetInProgress: false });
      } else {
        const useRecoveryCode = twoFactorEnabled && this.state.useRecoveryCode;
        await this.props.session.gatewayClient.resetPassword(
          user.email,
          this.state.password,
          this.props.token,
          twoFactorEnabled && !useRecoveryCode ? this.state.twoFactorCode : undefined,
          useRecoveryCode ? this.state.twoFactorRecoveryCode : undefined
        );
        this.setState({ success: true, resetInProgress: false });
      }
    } catch (e) {
      // A wrong code of the app, or a wrong or already used recovery code, is refused with a 403
      // (429 after too many wrong codes): the reset link itself is still valid. Only a 404 means
      // the link is dead — telling a user who mistyped a code to ask for a new link loops them.
      const status = get(e, 'response.status');
      if (this.state.twoFactorEnabled && this.state.useRecoveryCode && (status === 403 || status === 429)) {
        this.setState({ invalidRecoveryCode: true, resetInProgress: false });
      } else if (this.state.twoFactorEnabled && status === 403) {
        this.setState({ invalidTwoFactorCode: true, resetInProgress: false });
      } else if (this.state.twoFactorEnabled && status === 429) {
        this.setState({ tooManyTwoFactorAttempts: true, resetInProgress: false });
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
      invalidTwoFactorCode,
      tooManyTwoFactorAttempts,
      twoFactorEnabled,
      twoFactorResetDone,
      passwordRepeat,
      twoFactorCode,
      useRecoveryCode,
      twoFactorRecoveryCode,
      passwordError,
      passwordNotMatching,
      resetInProgress,
      twoFactorResetStatus,
      twoFactorResetError
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
        invalidTwoFactorCode={invalidTwoFactorCode}
        tooManyTwoFactorAttempts={tooManyTwoFactorAttempts}
        passwordError={passwordError}
        passwordNotMatching={passwordNotMatching}
        twoFactorEnabled={twoFactorEnabled}
        twoFactorResetDone={twoFactorResetDone}
        loading={twoFactorEnabled === null && !errorLink}
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
        requestTwoFactorReset={this.requestTwoFactorReset}
        twoFactorResetStatus={twoFactorResetStatus}
        twoFactorResetError={twoFactorResetError}
      />
    );
  }
}

export default connect('session', {})(ResetPasswordPage);
