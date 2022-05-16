import { RequestStatus } from '../utils/consts';
import update, { extend } from 'immutability-helper';
import debounce from 'debounce';

extend('$auto', (value, object) => {
  return object ? update(object, value) : update({}, value);
});

function createActions(store) {
  const actions = {
    async getScenes(state) {
      store.setState({
        scenesGetStatus: RequestStatus.Getting
      });
      try {
        const orderDir = state.getScenesOrderDir || 'asc';
        const params = {
          order_dir: orderDir
        };
        if (state.sceneSearch && state.sceneSearch.length) {
          params.search = state.sceneSearch;
        }
        const scenes = await state.httpClient.get('/api/v1/scene', params);
        store.setState({
          scenes,
          scenesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          scenesGetStatus: RequestStatus.Error
        });
      }
    },
    async search(state, e) {
      store.setState({
        sceneSearch: e.target.value
      });
      await actions.getScenes(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getScenesOrderDir: e.target.value
      });
      await actions.getScenes(store.getState());
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return actions;
}

export default createActions;
