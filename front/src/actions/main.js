import createActionsProfilePicture from './profilePicture';
import createActionsIntegration from './integration';
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
  const integrations = createActionsIntegration(store);

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
    async checkSession(state) {
      if (isUrlInArray(state.currentUrl, OPEN_PAGES)) {
        return null;
      }
      try {
        await state.session.init();
        if (!state.session.isConnected()) {
          route('/login');
        }
        const tasks = [state.httpClient.get('/api/v1/me'), actionsProfilePicture.loadProfilePicture(state)];
        const [user] = await Promise.all(tasks);
        store.setState({
          user
        });
      } catch (e) {
        const status = get(e, 'response.status');
        const error = get(e, 'response.data.error');
        if (status === 401 || status === 403) {
          state.session.reset();
          route('/login');
        } else if (error === 'GATEWAY_USER_NOT_LINKED') {
          route('/link-gateway-user');
        } else if (error === 'USER_NOT_ACCEPTED_LOCALLY') {
          route('/link-gateway-user');
        } else {
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

  return Object.assign(actions, actionsProfilePicture, integrations);
}

export default createActions;
