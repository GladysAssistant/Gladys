import createActionsProfilePicture from './profilePicture';
import { getDefaultState } from '../utils/getDefaultState';
import { route } from 'preact-router';
import get from 'get-value';
import { isUrlInArray } from '../utils/url';

const OPEN_PAGES = ['/signup', '/login', '/forgot-password', '/reset-password'];

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
    async checkSession(state) {
      if (isUrlInArray(state.currentUrl, OPEN_PAGES)) {
        return null;
      }
      await state.session.init();
      if (!state.session.isConnected()) {
        route('/login');
      }
      try {
        const tasks = [state.httpClient.get('/api/v1/me'), actionsProfilePicture.loadProfilePicture(state)];
        const results = await Promise.all(tasks);
        store.setState({
          user: results[0]
        });
      } catch (e) {
        const status = get(e, 'response.status');
        const error = get(e, 'response.error');
        if (status === 401) {
          route('/login');
        } else if (error === 'GATEWAY_USER_NOT_LINKED') {
          route('/link-gateway-user');
        } else {
          console.log(e);
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
