import get from 'get-value';
import { ForgotPasswordStatus, RequestStatus } from '../utils/consts';
import { validateEmail } from '../utils/validator';

function createActions(store) {
  const actions = {
    async forgotPassword(state, e) {
      if (e) {
        e.preventDefault();
      }
      if (!validateEmail(state.forgotPasswordEmail)) {
        return store.setState({
          forgotPasswordStatus: ForgotPasswordStatus.WrongEmailError
        });
      }
      store.setState({
        forgotPasswordStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/forgot_password', {
          email: state.forgotPasswordEmail,
          origin: window.location.origin
        });
        store.setState({
          forgotPasswordStatus: RequestStatus.Success
        });
      } catch (e) {
        const status = get(e, 'response.status');
        if (!status) {
          store.setState({
            forgotPasswordStatus: RequestStatus.NetworkError
          });
        } else if (status === 404) {
          store.setState({
            forgotPasswordStatus: ForgotPasswordStatus.UserNotFound
          });
        } else if (status === 429) {
          store.setState({
            forgotPasswordStatus: RequestStatus.RateLimitError
          });
        } else {
          store.setState({
            forgotPasswordStatus: RequestStatus.Error
          });
        }
      }
    },
    updateEmail(state, e) {
      store.setState({
        forgotPasswordEmail: e.target.value
      });
    }
  };

  return actions;
}

export default createActions;
