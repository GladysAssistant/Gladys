import { integrations } from '../../config/integrations';
import createActionsHouse from '../../actions/house';
import { RequestStatus } from '../../utils/consts';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    getIntegration(state, integrationName) {
      const integration = integrations.find(i => (i.link || i.key).toLowerCase() === integrationName);

      store.setState({
        integration
      });
    },
    async getIntegrationDevices(state, opts = {}) {
      const { options = { order_dir: 'asc' }, integration } = state;
      const newOptions = { ...options, ...opts };
      store.setState({
        getDevicesStatus: RequestStatus.Getting,
        options: newOptions
      });
      try {
        const integrationName = integration.link || integration.key;
        const devices = await state.httpClient.get(`/api/v1/service/${integrationName}/device`, newOptions);
        store.setState({
          devices,
          getDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getDevicesStatus: e.message
        });
      }
    },
    async search(state, e) {
      const { value } = e.target;
      const keyword = !value || value.length === 0 ? undefined : value;
      await actions.getIntegrationDevices(store.getState(), { keyword });
    },
    async changeOrderDir(state, e) {
      await actions.getIntegrationDevices(store.getState(), { order_dir: e.target.value });
    }
  };

  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
