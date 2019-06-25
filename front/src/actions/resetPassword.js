import get from 'get-value';
import { ResetPasswordStatus, RequestStatus } from '../utils/consts';

function createActions(store) {
  const actions = {
    async resetPassword(state, e) {
      if (e) {
        e.preventDefault();
      }
      const errors = {};
      if (!state.resetPasswordPassword || state.resetPasswordPassword.length < 8) {
        errors.password = true;
      }
      if (state.resetPasswordPassword !== state.resetPasswordPasswordRepeat) {
        errors.passwordRepeat = true;
      }
      store.setState({
        resetPasswordErrors: errors
      });
      if (Object.keys(errors).length) {
        return null;
      }
      store.setState({
        resetPasswordStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/reset_password', {
          password: state.resetPasswordPassword
        });
        store.setState({
          resetPasswordStatus: RequestStatus.Success
        });
      } catch (e) {
        const status = get(e, 'response.status');
        if (!status) {
          store.setState({
            resetPasswordStatus: RequestStatus.NetworkError
          });
        } else if (status === 400) {
          store.setState({
            resetPasswordStatus: ResetPasswordStatus.ResetTokenNotFound
          });
        } else if (status === 429) {
          store.setState({
            resetPasswordStatus: RequestStatus.RateLimitError
          });
        } else {
          store.setState({
            resetPasswordStatus: RequestStatus.Error
          });
        }
      }
    },
    updateResetToken(state, token) {
      state.session.setAccessToken(token);
    },
    updatePassword(state, e) {
      store.setState({
        resetPasswordPassword: e.target.value
      });
    },
    updatePasswordRepeat(state, e) {
      store.setState({
        resetPasswordPasswordRepeat: e.target.value
      });
    }
  };

  return actions;
}

export default createActions;
