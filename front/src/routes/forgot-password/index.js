import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import validateEmail from '../../utils/validateEmail';
import { ForgotPasswordStatus, RequestStatus } from '../../utils/consts';
import ForgotPasswordPage from './ForgotPasswordPage';

class ForgotPassword extends Component {
  forgotPassword = async e => {
    const { forgotPasswordEmail } = this.state;
    if (e) {
      e.preventDefault();
    }

    if (!validateEmail(forgotPasswordEmail)) {
      return this.setState({
        forgotPasswordStatus: ForgotPasswordStatus.WrongEmailError
      });
    }

    this.setState({
      forgotPasswordStatus: RequestStatus.Getting
    });

    try {
      await this.props.httpClient.post('/api/v1/forgot_password', {
        email: forgotPasswordEmail,
        origin: window.location.origin
      });

      this.setState({
        forgotPasswordStatus: RequestStatus.Success
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

  updateEmail = e => {
    this.setState({
      forgotPasswordEmail: e.target.value
    });
  };

  render({}, state) {
    return <ForgotPasswordPage {...state} updateEmail={this.updateEmail} forgotPassword={this.forgotPassword} />;
  }
}

export default connect('httpClient')(ForgotPassword);
