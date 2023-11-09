import createActionsProfilePicture from './profilePicture';
import { getDefaultState } from '../utils/getDefaultState';
import { route } from 'preact-router';
import get from 'get-value';
import { isUrlInArray } from '../utils/url';

const OPEN_PAGES = [
  '/signup',
  '/signup/create-account-gladys-gateway',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/gateway-configure-two-factor',
  '/signup-gateway',
  '/subscribe-gateway',
  '/confirm-email'
];

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);

  const actions = {
    handleRoute(state, e) {
      store.setState({
        currentUrl: e.url,
        showDropDown: false,
        showCollapsedMenu: false
      });
    },
    toggleDropDown(state) {
      store.setState({
        showDropDown: !state.showDropDown
      });
    },
    toggleCollapsedMenu(state) {
      store.setState({
        showCollapsedMenu: !state.showCollapsedMenu
      });
    },
    redirectToLogin() {
      const returnUrl = window.location.pathname + window.location.search;
      route(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    },
    async refreshTabletMode(state) {
      try {
        const currentSession = await state.httpClient.get('/api/v1/session/tablet_mode');
        store.setState({
          tabletMode: currentSession.tablet_mode
        });
      } catch (e) {
        console.error(e);
      }
    },
    async checkSession(state) {
      if (isUrlInArray(state.currentUrl, OPEN_PAGES)) {
        return null;
      }
      try {
        await state.session.init();
        if (!state.session.isConnected()) {
          actions.redirectToLogin();
        }
        const tasks = [
          state.httpClient.get('/api/v1/me'),
          actionsProfilePicture.loadProfilePicture(state),
          actions.refreshTabletMode(state)
        ];
        const [user] = await Promise.all(tasks);
        store.setState({
          user
        });
        if (state.session.getGatewayUser) {
          const gatewayUser = await state.session.getGatewayUser();
          const now = new Date();
          if (new Date(gatewayUser.current_period_end) < now) {
            store.setState({
              gatewayAccountExpired: true
            });
          }
        }
      } catch (e) {
        const status = get(e, 'response.status');
        const error = get(e, 'response.data.error');
        const gatewayErrorMessage = get(e, 'response.data.error_message');
        const errorMessageOtherFormat = get(e, 'response.data.message');
        if (status === 401 && errorMessageOtherFormat === 'TABLET_IS_LOCKED') {
          route(`/locked${window.location.search}`);
        } else if (status === 401) {
          state.session.reset();
          actions.redirectToLogin();
        } else if (error === 'GATEWAY_USER_NOT_LINKED') {
          route('/link-gateway-user');
        } else if (error === 'USER_NOT_ACCEPTED_LOCALLY') {
          route('/link-gateway-user');
        } else if (gatewayErrorMessage === 'NO_INSTANCE_FOUND' || errorMessageOtherFormat === 'NO_INSTANCE_DETECTED') {
          route('/link-gateway-user');
        } else {
          console.error(e);
        }
      }
    },
    async logout(state, e) {
      e.preventDefault();
      const user = state.session.getUser();
      if (user && user.session_id) {
        await state.httpClient.post(`/api/v1/session/${user.session_id}/revoke`);
      }
      state.session.reset();
      route('/login', true);
      const defaultState = getDefaultState();
      store.setState(defaultState, true);
    }
  };

  return Object.assign(actions, actionsProfilePicture);
}

export default createActions;
