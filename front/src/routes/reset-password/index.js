import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ResetPasswordPage from './ResetPasswordPage';
import actions from '../../actions/resetPassword';
import { RequestStatus, ResetPasswordStatus } from '../../utils/consts';

class ResetPassword extends Component {
  componentWillMount() {
    this.props.updateResetToken(this.props.token);
  }
  render(props, {}) {
    const errored =
      props.resetPasswordStatus === RequestStatus.NetworkError ||
      props.resetPasswordStatus === ResetPasswordStatus.ResetTokenNotFound ||
      props.resetPasswordStatus === RequestStatus.Error ||
      props.resetPasswordStatus === RequestStatus.RateLimitError;
    return <ResetPasswordPage {...props} errored={errored} />;
  }
}

export default connect(
  'resetPasswordStatus,resetPasswordErrors,resetPasswordPassword,resetPasswordPasswordRepeat',
  actions
)(ResetPassword);
