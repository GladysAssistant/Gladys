import { LoginStatus, RequestStatus } from '../../utils/consts';
import { validateEmail, cleanEmail } from '../../utils/validator';
import createActionsProfilePicture from '../profilePicture';
import { route } from 'preact-router';
import { isSafeReturnUrl } from '../../utils/url';
import { isUnreachableError, isServerError, isTooManyRequestsError } from '../../utils/connectionError';

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);

  const actions = {
    init(state, returnUrl) {
      // Only keep return URLs relative to this domain
      // (we want to avoid redirecting to another domain for security issues)
      store.setState({
        loginReturnUrl: isSafeReturnUrl(returnUrl) ? returnUrl : null
      });
    },
    async login(state, e) {
      if (e) {
        e.preventDefault();
      }
      const email = cleanEmail(state.loginFormEmailValue);
      if (!validateEmail(email)) {
        return store.setState({
          loginStatus: LoginStatus.WrongEmailError
        });
      }
      store.setState({
        loginStatus: LoginStatus.Processing
      });
      try {
        // Login
        const userFromLogin = await state.httpClient.post('/api/v1/login', {
          email,
          password: state.loginFormPasswordValue
        });
        state.session.saveUser(userFromLogin);
        state.session.init();
        // Get full user from backend
        const user = await state.httpClient.get('/api/v1/me');
        store.setState({
          user,
          loginStatus: LoginStatus.LoginSuccess,
          // Gladys answers: whatever a session check concluded before this sign-in
          gladysUnreachable: false,
          loginFormEmailValue: '',
          loginFormPasswordValue: ''
        });
        actionsProfilePicture.loadProfilePicture(state);
        // redirect to the page the user asked for, or to the dashboard
        route(state.loginReturnUrl || '/dashboard');
      } catch (e) {
        // Only a refusal of Gladys is a wrong email or password: a Gladys that does not
        // answer, that asks to wait or that fails says so, or the user retypes a password
        // that was right all along
        let loginStatus = LoginStatus.WrongCredentialsError;
        if (isUnreachableError(e)) {
          loginStatus = LoginStatus.NetworkError;
        } else if (isTooManyRequestsError(e)) {
          loginStatus = LoginStatus.TooManyRequestsError;
        } else if (isServerError(e) || !e.response) {
          // no response and no request either: the page itself failed
          console.error(e);
          loginStatus = LoginStatus.UnknownError;
        }
        store.setState({
          loginStatus
        });
      }
    },
    onEmailChange(state, event) {
      store.setState({
        loginFormEmailValue: event.target.value
      });
    },
    onPasswordChange(state, event) {
      store.setState({
        loginFormPasswordValue: event.target.value
      });
    },
    async checkIfInstanceIsConfigured(state) {
      // check instance state
      store.setState({
        checkIfInstanceIsConfiguredRequestState: RequestStatus.Getting
      });
      try {
        const instanceState = await state.httpClient.get('/api/v1/setup');
        if (!instanceState.account_configured) {
          route('/signup');
        }
        store.setState({
          checkIfInstanceIsConfiguredRequestState: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          checkIfInstanceIsConfiguredRequestState: RequestStatus.Error
        });
      }
    }
  };

  return actions;
}

export default createActions;
