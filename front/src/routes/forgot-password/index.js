import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import get from 'get-value';

import validateEmail from '../../utils/validateEmail';
import { cleanEmail } from '../../utils/validator';
import { ForgotPasswordStatus, RequestStatus } from '../../utils/consts';
import ForgotPasswordPage from './ForgotPasswordPage';

class ForgotPassword extends Component {
  forgotPassword = async e => {
    const forgotPasswordEmail = cleanEmail(this.state.forgotPasswordEmail);
    if (e) {
      e.preventDefault();
    }

    if (this.state.forgotPasswordStatus === RequestStatus.Getting) {
      return null;
    }

    // a code is being checked: a new one now would clear that request's guard and let a second
    // check start on a code that is single use
    if (this.state.verifyCodeStatus === RequestStatus.Getting) {
      return null;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      return this.setState({
        forgotPasswordStatus: ForgotPasswordStatus.WrongEmailError
      });
    }

    this.setState({
      forgotPasswordStatus: RequestStatus.Getting,
      verifyCodeStatus: null
    });

    try {
      // the server sends a reset link when this origin is used by a live
      // session of the user, a one-time code otherwise, and does not say
      // which: the code form is shown in both cases, a link is simply clicked
      await this.props.httpClient.post('/api/v1/forgot_password', {
        email: forgotPasswordEmail,
        origin: window.location.origin
      });

      this.setState({
        forgotPasswordStatus: RequestStatus.Success,
        // kept once a code was requested: on a phone, asking for a new one keeps the code screen
        codeSent: true
      });
    } catch (e) {
      const status = get(e, 'response.status');
      if (!status) {
        this.setState({
          forgotPasswordStatus: RequestStatus.NetworkError
        });
      } else if (status === 404) {
        this.setState({
          forgotPasswordStatus: ForgotPasswordStatus.UserNotFound
        });
      } else if (status === 429) {
        this.setState({
          forgotPasswordStatus: RequestStatus.RateLimitError
        });
      } else {
        this.setState({
          forgotPasswordStatus: RequestStatus.Error
        });
      }
    }
  };

  verifyCode = async e => {
    const { forgotPasswordCode } = this.state;
    const forgotPasswordEmail = cleanEmail(this.state.forgotPasswordEmail);
    if (e) {
      e.preventDefault();
    }

    // one request at a time: the code is single use, a second request in
    // flight would consume it and fail
    if (this.state.verifyCodeStatus === RequestStatus.Getting) {
      return null;
    }

    if (!forgotPasswordCode || forgotPasswordCode.trim().length === 0) {
      return this.setState({
        verifyCodeStatus: ForgotPasswordStatus.InvalidCode
      });
    }

    this.setState({
      verifyCodeStatus: RequestStatus.Getting
    });

    try {
      const { access_token: accessToken } = await this.props.httpClient.post('/api/v1/forgot_password/code', {
        email: forgotPasswordEmail,
        code: forgotPasswordCode
      });
      this.setState({
        verifyCodeStatus: RequestStatus.Success
      });
      route(`/reset-password?token=${encodeURIComponent(accessToken)}`);
    } catch (e) {
      const status = get(e, 'response.status');
      if (!status) {
        this.setState({
          verifyCodeStatus: RequestStatus.NetworkError
        });
      } else if (status === 401 || status === 400) {
        // a refused code is a 401, but it rarely comes back as one: without a session the http
        // client answers a 401 by refreshing a token it does not have, and it is the refusal of
        // that refresh (a 400) that is thrown. Both mean the same here: this code does not work
        this.setState({
          verifyCodeStatus: ForgotPasswordStatus.InvalidCode
        });
      } else if (status === 429) {
        this.setState({
          verifyCodeStatus: RequestStatus.RateLimitError
        });
      } else {
        this.setState({
          verifyCodeStatus: RequestStatus.Error
        });
      }
    }
  };

  updateEmail = e => {
    this.setState({
      forgotPasswordEmail: e.target.value
    });
  };

  updateCode = e => {
    this.setState({
      forgotPasswordCode: e.target.value
    });
  };

  render({}, state) {
    return (
      <ForgotPasswordPage
        {...state}
        updateEmail={this.updateEmail}
        forgotPassword={this.forgotPassword}
        updateCode={this.updateCode}
        verifyCode={this.verifyCode}
      />
    );
  }
}

export default connect('httpClient')(ForgotPassword);
