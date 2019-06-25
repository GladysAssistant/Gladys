import createActionsProfilePicture from './profilePicture';
import { getDefaultState } from '../utils/getDefaultState';
import { route } from 'preact-router';
import { isUrlInArray } from '../utils/url';

const OPEN_PAGES = ['/signup', '/login', '/forgot-password', '/reset-password'];

function createActions(store) {
  const actionsProfilePicture = createActionsProfilePicture(store);

  const actions = {
    handleRoute(state, e) {
      store.setState({
        currentUrl: e.url,
        showDropDown: false
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
      state.session.init();
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
        route('/login');
      }
    },
    async logout(state, e) {
      e.preventDefault();
      const user = state.session.getUser();
      if (user.session_id) {
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
