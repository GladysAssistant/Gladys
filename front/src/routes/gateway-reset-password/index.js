import { Component } from 'preact';
import { connect } from 'unistore/preact';
import linkState from 'linkstate';
import get from 'get-value';
import ResetPassword from './ResetPassword';
import { RequestStatus } from '../../utils/consts';
import { savePendingPasswordReset, clearPendingPasswordReset } from '../../utils/pendingPasswordReset';

// The errors of the second factor and of the link, cleared together: an old one must never stay
// on screen next to a new state
const NO_ERROR = {
  errorLink: false,
  errorUnknown: false,
  invalidRecoveryCode: false,
  invalidTwoFactorCode: false,
  tooManyTwoFactorAttempts: false
};

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
      // only a 404 means the link is dead: a network error or a 5xx must not send the user to
      // ask for a new link. The form stays usable: the submit reads the link again.
      if (get(e, 'response.status') === 404) {
        this.setState({ errorLink: true });
      } else {
        this.setState({ errorUnknown: true, linkNotRead: true });
      }
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
        this.setState({ ...NO_ERROR, twoFactorEnabled: false, twoFactorResetDone: true, useRecoveryCode: false });
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
      // the landing page of the emailed link, opened in this browser, leads back to this link
      savePendingPasswordReset(this.props.token);
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
    this.setState({ ...NO_ERROR, useRecoveryCode: true });
  };

  showTwoFactorCode = e => {
    e.preventDefault();
    this.setState({ ...NO_ERROR, useRecoveryCode: false });
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
      ...NO_ERROR,
      resetInProgress: true
    });

    let user;
    try {
      user = await this.props.session.gatewayClient.getResetPasswordEmail(this.props.token);
    } catch (e) {
      // reading the link: a 403 or 429 here is not about a code
      this.setState({ ...this.linkErrorState(e), resetInProgress: false });
      return;
    }

    const twoFactorEnabled = user.two_factor_enabled === true;
    if (twoFactorEnabled && this.state.twoFactorEnabled !== true) {
      // the code was not asked yet (link not read on load, or two-factor enabled since)
      this.setState({ twoFactorEnabled: true, twoFactorResetDone: false, linkNotRead: false, resetInProgress: false });
      return;
    }

    // captured now: the tab refresh may change the state while the request runs
    const useRecoveryCode = twoFactorEnabled && this.state.useRecoveryCode;
    try {
      await this.props.session.gatewayClient.resetPassword(
        user.email,
        this.state.password,
        this.props.token,
        twoFactorEnabled && !useRecoveryCode ? this.state.twoFactorCode : undefined,
        useRecoveryCode ? this.state.twoFactorRecoveryCode : undefined
      );
      clearPendingPasswordReset();
      this.setState({ success: true, resetInProgress: false });
    } catch (e) {
      const status = get(e, 'response.status');
      if (twoFactorEnabled && status === 429) {
        // too many wrong codes, whatever the kind: the user has to wait, not to try other codes
        this.setState({ tooManyTwoFactorAttempts: true, resetInProgress: false });
      } else if (twoFactorEnabled && status === 403) {
        // a wrong code of the app, or a wrong or used recovery code: the link is still valid
        this.setState({
          invalidRecoveryCode: useRecoveryCode,
          invalidTwoFactorCode: !useRecoveryCode,
          resetInProgress: false
        });
      } else {
        this.setState({ ...this.linkErrorState(e), resetInProgress: false });
      }
    }
  };

  // Only a 404 means the link is dead (used, expired, unknown): anything else (network, 5xx)
  // must not send the user to ask for a new link
  linkErrorState = e => (get(e, 'response.status') === 404 ? { errorLink: true } : { errorUnknown: true });

  render(
    {},
    {
      password,
      success,
      errorLink,
      errorUnknown,
      linkNotRead,
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
        errorUnknown={errorUnknown}
        invalidRecoveryCode={invalidRecoveryCode}
        invalidTwoFactorCode={invalidTwoFactorCode}
        tooManyTwoFactorAttempts={tooManyTwoFactorAttempts}
        passwordError={passwordError}
        passwordNotMatching={passwordNotMatching}
        twoFactorEnabled={twoFactorEnabled}
        twoFactorResetDone={twoFactorResetDone}
        loading={twoFactorEnabled === null && !errorLink && !linkNotRead}
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
