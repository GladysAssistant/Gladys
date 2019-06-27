import get from 'get-value';
import { RequestStatus, LoginStatus } from '../../utils/consts';
import { validateEmail } from '../../utils/validator';
import { ERROR_MESSAGES } from '../../../../server/utils/constants';
import { route } from 'preact-router';

function createActions(store) {
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
        // get user
        const user = await state.session.gatewayClient.getMyself();
        // save user
        state.session.saveUser(user);
        // get setup state
        const setupState = await state.session.gatewayClient.getSetupState();
        const accountSetup =
          setupState.billing_setup && setupState.gladys_instance_setup && setupState.user_gladys_acccount_linked;
        if (accountSetup) {
          route('/dashboard');
        } else {
          route('/gateway-setup');
        }
      } catch (e) {
        store.setState({
          gatewayLoginStatus: RequestStatus.Error
        });
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
