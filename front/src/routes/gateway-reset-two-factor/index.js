import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import ResetTwoFactor from './ResetTwoFactor';
import { RequestStatus } from '../../utils/consts';

// Landing page of the link emailed by Gladys Plus to reset the two-factor authentication
// of a user who lost their app and their recovery codes, with no Gladys connected.
// The reset only happens on click: an email client prefetching the link must not do it.
class ResetTwoFactorPage extends Component {
  state = {
    status: null,
    error: null
  };

  resetTwoFactor = async e => {
    e.preventDefault();
    // a second click while the first one is pending would be refused (the token is
    // single-use) and shown as a dead link over the success
    if (this.state.status === RequestStatus.Getting || this.state.status === RequestStatus.Success) {
      return;
    }
    this.setState({ status: RequestStatus.Getting, error: null });
    try {
      await this.props.session.gatewayClient.resetTwoFactor(this.props.token);
      this.setState({ status: RequestStatus.Success });
    } catch (e) {
      const status = get(e, 'response.status');
      // the request carries the reset token: never the whole error in the console
      console.error('Could not reset the two factor authentication', status || e.message);
      const errorMessage = get(e, 'response.data.error_message');
      let error = 'UNKNOWN';
      if (errorMessage === 'INSTANCE_CONNECTED') {
        error = 'INSTANCE_CONNECTED';
      } else if (status === 404) {
        error = 'LINK';
      }
      this.setState({ status: RequestStatus.Error, error });
    }
  };

  render({ token }, { status, error }) {
    return (
      <ResetTwoFactor
        tokenMissing={!token}
        status={status}
        error={error}
        resetTwoFactor={this.resetTwoFactor}
        resetInProgress={status === RequestStatus.Getting}
        success={status === RequestStatus.Success}
      />
    );
  }
}

export default connect('session', {})(ResetTwoFactorPage);
