import get from 'get-value';
import { RequestStatus, LoginStatus } from '../../utils/consts';
import { validateEmail } from '../../utils/validator';
import { ERROR_MESSAGES } from '../../../../server/utils/constants';
import createActionsProfilePicture from '../profilePicture';
import { route } from 'preact-router';

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);
  const actions = {
    init(state, returnUrl) {
      // One-shot flag set by finalizeTwoFactorSetup: the user just enabled 2FA
      // and was routed here with a valid two_factor_token already in the state,
      // so we keep the step 2 form instead of resetting the login flow.
      if (state.gatewayLoginPreserveStateOnce) {
        const preservedState = {
          gatewayLoginPreserveStateOnce: false
        };
        if (returnUrl && returnUrl.startsWith('/')) {
          preservedState.gatewayLoginReturnUrl = returnUrl;
        }
        store.setState(preservedState);
        return;
      }
      const newState = {
        gatewayLoginStep2: false,
        gatewayLoginStatus: null,
        gatewayLoginEmail: null,
        gatewayLoginPassword: null,
        gatewayLoginTwoFactorCode: null,
        gatewayTwoFactorJustEnabled: false,
        gatewayLoginUseRecoveryCode: false,
        gatewayLoginRecoveryCode: null,
        gatewayLoginRecoveryCodes: null,
        gatewayLoginRecoveryCodesStatus: null,
        gatewayLoginRecoveryCodesTwoFactorCode: null,
        gatewayLoginRecoveryCodesWrongTwoFactorCode: false
      };
      // If there is a return URL and the URL is relative to this domain
      // (we want to avoid redirecting to another domain for security issues)
      if (returnUrl && returnUrl.startsWith('/')) {
        newState.gatewayLoginReturnUrl = returnUrl;
      }
      store.setState(newState);
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
        gatewayLoginStatus: RequestStatus.Getting,
        gatewayLoginError: null
      });
      try {
        const gatewayLoginResults = await state.session.gatewayClient.login(
          state.gatewayLoginEmail,
          state.gatewayLoginPassword
        );
        if (gatewayLoginResults.two_factor_token) {
          store.setState({
            gatewayLoginResults,
            gatewayLoginStep2: true,
            gatewayTwoFactorJustEnabled: false,
            gatewayLoginStatus: RequestStatus.Success
          });
        } else {
          state.session.saveTwoFactorAccessToken(gatewayLoginResults.access_token);
          route('/gateway-configure-two-factor');
        }
      } catch (e) {
        const error = get(e, 'response.data.error');
        const status = get(e, 'response.status');

        if (error === ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET) {
          store.setState({
            gatewayLoginStatus: RequestStatus.NetworkError
          });
        } else if (status === 403 || status === 404) {
          store.setState({
            gatewayLoginStatus: LoginStatus.WrongCredentialsError
          });
        } else {
          store.setState({
            gatewayLoginStatus: LoginStatus.UnknownError,
            gatewayLoginError: e.message
          });
        }
      }
    },
    async finalizeTwoFactorSetup(state) {
      // The user just enabled 2FA from the configure page: we log in again
      // silently with the credentials still in memory, so they only have to
      // enter a fresh code from their app to finalize the connection.
      const gatewayLoginResults = await state.session.gatewayClient.login(
        state.gatewayLoginEmail,
        state.gatewayLoginPassword
      );
      store.setState({
        gatewayLoginResults,
        gatewayLoginStep2: true,
        gatewayLoginTwoFactorCode: null,
        gatewayTwoFactorJustEnabled: true,
        gatewayLoginPreserveStateOnce: true,
        gatewayLoginStatus: RequestStatus.Success
      });
      route('/login');
    },
    async finishLogin(state, data) {
      // save informations in localstorage
      state.session.saveLoginInformations(data);
      // connect
      await state.session.connect();
      let nextUrl;
      if (data.gladysUserId) {
        // get user
        const user = await state.httpClient.get('/api/v1/me');
        store.setState({
          user
        });
        // save user
        state.session.saveUser(user);
        // get profile picture
        await actionsProfilePicture.loadProfilePicture(store.getState());
        // verify if we need to redirect to the previous page
        nextUrl = state.gatewayLoginReturnUrl || '/dashboard';
      } else {
        nextUrl = '/link-gateway-user';
      }
      // The user just enabled two-factor: we generate their recovery codes and
      // display them once (only hashes are stored server side) before finishing
      // the login.
      if (state.gatewayTwoFactorJustEnabled) {
        store.setState({
          gatewayLoginRecoveryCodesNextUrl: nextUrl,
          gatewayLoginStatus: RequestStatus.Success
        });
        await actions.generateRecoveryCodes(store.getState());
        return;
      }
      route(nextUrl);
    },
    async generateRecoveryCodes(state) {
      // The login itself already succeeded here, so a failure must not send the user
      // back to the login form: we display it on the recovery codes screen instead,
      // where they can retry, because there is no other way to get a set of codes.
      // The Gateway requires a current code from the two-factor app: the code the user just
      // logged in with is reused, but it expires quickly so a retry asks for a fresh one.
      const twoFactorCode = state.gatewayLoginRecoveryCodesTwoFactorCode || state.gatewayLoginTwoFactorCode;
      store.setState({
        gatewayLoginRecoveryCodesStatus: RequestStatus.Getting,
        gatewayLoginRecoveryCodesWrongTwoFactorCode: false,
        gatewayLoginRecoveryCodes: null
      });
      try {
        const { recovery_codes: recoveryCodes } = await state.session.gatewayClient.generateTwoFactorRecoveryCodes(
          twoFactorCode
        );
        store.setState({
          gatewayLoginRecoveryCodes: recoveryCodes,
          gatewayLoginRecoveryCodesStatus: RequestStatus.Success
        });
      } catch (e) {
        console.error(e);
        const status = get(e, 'response.status');
        store.setState({
          gatewayLoginRecoveryCodesStatus: RequestStatus.Error,
          // 403: the code is wrong or expired, a new one is needed
          gatewayLoginRecoveryCodesWrongTwoFactorCode: status === 403,
          gatewayLoginRecoveryCodesTwoFactorCode: null
        });
      }
    },
    updateRecoveryCodesTwoFactorCode(state, e) {
      store.setState({
        gatewayLoginRecoveryCodesTwoFactorCode: e.target.value
      });
    },
    async handleLoginError(state, e, wrongCodeStatus) {
      console.error(e);
      const error = get(e, 'response.data.error');
      const errorMessage = get(e, 'response.data.error_message');
      const status = get(e, 'response.status');
      // if user was previously linked to another instance, we reset the user id
      if (error === 'LINKED_USER_NOT_FOUND') {
        await state.session.gatewayClient.updateUserIdInGladys(null);
        route('/link-gateway-user');
      } else if (error === 'USER_NOT_ACCEPTED_LOCALLY') {
        store.setState({
          gatewayLoginStatus: RequestStatus.UserNotAcceptedLocally
        });
      } else if (errorMessage === 'NO_INSTANCE_FOUND') {
        store.setState({
          gatewayLoginStatus: RequestStatus.GatewayNoInstanceFound
        });
      } else if (status >= 400 && status < 500) {
        store.setState({
          gatewayLoginStatus: wrongCodeStatus
        });
      } else {
        store.setState({
          gatewayLoginStatus: RequestStatus.Error
        });
      }
    },
    async loginTwoFactor(state, e) {
      if (e) {
        e.preventDefault();
      }
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
        await actions.finishLogin(state, data);
      } catch (e) {
        await actions.handleLoginError(state, e, LoginStatus.WrongTwoFactorCodeError);
      }
    },
    async loginTwoFactorRecoveryCode(state, e) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        gatewayLoginStatus: RequestStatus.Getting
      });
      try {
        // login with a single-use recovery code instead of a two factor code
        const data = await state.session.gatewayClient.loginTwoFactorRecoveryCode(
          state.gatewayLoginResults.two_factor_token,
          state.gatewayLoginPassword,
          state.gatewayLoginRecoveryCode,
          window.navigator.userAgent
        );
        await actions.finishLogin(state, data);
      } catch (e) {
        await actions.handleLoginError(state, e, LoginStatus.WrongRecoveryCodeError);
      }
    },
    continueAfterRecoveryCodes(state) {
      const nextUrl = state.gatewayLoginRecoveryCodesNextUrl || '/dashboard';
      store.setState({
        gatewayLoginRecoveryCodes: null,
        gatewayLoginRecoveryCodesNextUrl: null,
        gatewayLoginRecoveryCodesStatus: null,
        gatewayLoginRecoveryCodesTwoFactorCode: null,
        gatewayLoginRecoveryCodesWrongTwoFactorCode: false
      });
      route(nextUrl);
    },
    showRecoveryCodeLogin(state, e) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        gatewayLoginUseRecoveryCode: true,
        gatewayLoginStatus: null
      });
    },
    showTwoFactorCodeLogin(state, e) {
      if (e) {
        e.preventDefault();
      }
      store.setState({
        gatewayLoginUseRecoveryCode: false,
        gatewayLoginStatus: null
      });
    },
    updateLoginRecoveryCode(state, e) {
      store.setState({
        gatewayLoginRecoveryCode: e.target.value
      });
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
      if (e.target.value.length === 6) {
        const upToDateState = store.getState();
        actions.loginTwoFactor(upToDateState, e);
      }
    }
  };
  return actions;
}

export default createActions;
