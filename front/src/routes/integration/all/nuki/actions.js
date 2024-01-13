import { RequestStatus } from '../../../../utils/consts';
import update from 'immutability-helper';
import createActionsHouse from '../../../../actions/house';
import createActionsIntegration from '../../../../actions/integration';
import debounce from 'debounce';

const HIDDEN_PASSWORD = '*********';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let configuration = {};
      try {
        configuration = await state.httpClient.get('/api/v1/service/nuki/config');
      } finally {
        store.setState({
          nukiUsername: configuration.login,
          nukiPassword: configuration.login && HIDDEN_PASSWORD,
          // HYGEN : createActions field placeholder
          // HYGEN : end of placeholder
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'nukiPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        nukiConnectionStatus: RequestStatus.Getting,
        nukiConnected: false,
        nukiConnectionError: undefined
      });
      try {
        const { nukiUsername, nukiPassword } = state;
        await state.httpClient.post('/api/v1/service/nuki/config', {
          login: nukiUsername,
          password: (state.passwordChanges && nukiPassword) || undefined
        });
        await state.httpClient.get(`/api/v1/service/nuki/connect`);

        store.setState({
          nukiConnectionStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ nukiConnectionStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          nukiConnectionStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    async getNukiDevices(state) {
      store.setState({
        getNukiDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: 'asc'
        };
        if (state.nukiSearch && state.awesomeSearch.length) {
          options.search = state.nukiSearch;
        }
        const nukiDevices = await state.httpClient.get('/api/v1/service/nuki/device', options);
        store.setState({
          nukiDevices,
          getNukiDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getNukiDevicesStatus: RequestStatus.Error
        });
      }
    },
    displayConnectedMessage() {
      // display 3 seconds a message "Nuki connected"
      store.setState({
        nukiConnected: true,
        nukiConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            nukiConnected: false,
            nukiConnectionStatus: undefined
          }),
        3000
      );
    },
    displayNukiError(state, error) {
      store.setState({
        nukiConnected: false,
        nukiConnectionStatus: undefined,
        nukiConnectionError: error
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;