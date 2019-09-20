import get from 'get-value';
import { RequestStatus, LoginStatus } from '../../utils/consts';
import { validateEmail } from '../../utils/validator';
import { ERROR_MESSAGES } from '../../../../server/utils/constants';
import createActionsProfilePicture from '../profilePicture';
import { route } from 'preact-router';

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);
  const actions = {
    init(state) {
      store.setState({
        gatewayLoginStep2: false,
        gatewayLoginStatus: null,
        gatewayLoginEmail: null,
        gatewayLoginPassword: null,
        gatewayLoginTwoFactorCode: null
      });
    },
    async login(state, e) {
      if (e) {
        e.preventDefault();
      }
      if (!validateEmail(state.gatewayLoginEmail)) {
        return store.setState({
          gatewayLoginStatus: LoginStatus.WrongEmailError
        });
      }
      store.setState({
        gatewayLoginStatus: RequestStatus.Getting
      });
      try {
        const gatewayLoginResults = await state.session.gatewayClient.login(
          state.gatewayLoginEmail,
          state.gatewayLoginPassword
        );
        store.setState({
          gatewayLoginResults,
          gatewayLoginStep2: true,
          gatewayLoginStatus: RequestStatus.Success
        });
      } catch (e) {
        const error = get(e, 'response.data.error');
        if (error === ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET) {
          store.setState({
            gatewayLoginStatus: RequestStatus.NetworkError
          });
        } else {
          store.setState({
            gatewayLoginStatus: LoginStatus.WrongCredentialsError
          });
        }
      }
    },
    async loginTwoFactor(state) {
      store.setState({
        gatewayLoginStatus: RequestStatus.Getting
      });
      try {
        // login two factor
        const data = await state.session.gatewayClient.loginTwoFactor(
          state.gatewayLoginResults.two_factor_token,
          state.gatewayLoginPassword,
          state.gatewayLoginTwoFactorCode,
          window.navigator.userAgent
        );
        // save informations in localstorage
        state.session.saveLoginInformations(data);
        // connect
        state.session.connect();
        if (data.gladysUserId) {
          // get user
          const user = await state.httpClient.get('/api/v1/me');
          // save user
          state.session.saveUser(user);
          // get profile picture
          await actionsProfilePicture.loadProfilePicture(store.getState());
          route('/dashboard');
        } else {
          route('/link-gateway-user');
        }
      } catch (e) {
        const error = get(e, 'response.error');
        // if user was previously linked to another instance, we reset the user id
        if (error === 'LINKED_USER_NOT_FOUND') {
          await state.session.gatewayClient.updateUserIdInGladys(null);
          route('/link-gateway-user');
        } else if (error === 'USER_NOT_ACCEPTED_LOCALLY') {
          store.setState({
            gatewayLoginStatus: RequestStatus.UserNotAcceptedLocally
          });
        } else {
          store.setState({
            gatewayLoginStatus: RequestStatus.Error
          });
        }
      }
    },
    updateLoginEmail(state, e) {
      store.setState({
        gatewayLoginEmail: e.target.value
      });
    },
    updateLoginPassword(state, e) {
      store.setState({
        gatewayLoginPassword: e.target.value
      });
    },
    updateLoginTwoFactorCode(state, e) {
      store.setState({
        gatewayLoginTwoFactorCode: e.target.value
      });
    }
  };
  return actions;
}

export default createActions;
