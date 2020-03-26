import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getYeelightDevices(state) {
      store.setState({
        getYeelightStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getYeelightOrderDir || 'asc'
        };
        if (state.yeelightSearch && state.yeelightSearch.length) {
          options.search = state.yeelightSearch;
        }

        const yeelightDevices = await state.httpClient.get('/api/v1/service/yeelight/device', options);
        store.setState({
          yeelightDevices,
          getYeelightStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getYeelightStatus: e.message
        });
      }
    },
    async getDiscoveredYeelightDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/yeelight/discover');
        store.setState({
          discoveredDevices,
          loading: false,
          errorLoading: false
        });
      } catch (e) {
        store.setState({
          loading: false,
          errorLoading: true
        });
      }
    },
    async getHouses(state) {
      store.setState({
        housesGetStatus: RequestStatus.Getting
      });
      try {
        const params = {
          expand: 'rooms'
        };
        const housesWithRooms = await state.httpClient.get(`/api/v1/house`, params);
        store.setState({
          housesWithRooms,
          housesGetStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          housesGetStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceField(state, listName, index, field, value) {
      const devices = update(state[listName], {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        [listName]: devices
      });
    },
    updateFeatureProperty(state, listName, deviceIndex, featureIndex, property, value) {
      const devices = update(state[listName], {
        [deviceIndex]: {
          features: {
            [featureIndex]: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });

      store.setState({
        [listName]: devices
      });
    },
    async saveDevice(state, listName, index) {
      const device = state[listName][index];
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      const devices = update(state[listName], {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        [listName]: devices
      });
    },
    async deleteDevice(state, index) {
      const device = state.yeelightDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const yeelightDevices = update(state.yeelightDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        yeelightDevices
      });
    },
    async search(state, e) {
      store.setState({
        yeelightSearch: e.target.value
      });
      await actions.getYeelightDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getYeelightOrderDir: e.target.value
      });
      await actions.getYeelightDevices(store.getState());
    },
    async forceScan(state) {
      store.setState({
        loading: true
      });
      try {
        await state.httpClient.post('/api/v1/service/yeelight/discover');
        store.setState({
          discoveredDevices: [],
          errorLoading: false
        });

        setTimeout(store.setState, 5000, {
          loading: false
        });
      } catch (e) {
        store.setState({
          loading: false,
          errorLoading: true
        });
      }
    },
    addDiscoveredDevice(state, newDevice) {
      const existingDevices = state.discoveredDevices || [];
      const newDevices = [];

      let added = false;
      existingDevices.forEach(device => {
        if (device.external_id === newDevice.external_id) {
          newDevices.push(newDevice);
          added = true;
        } else {
          newDevices.push(device);
        }
      });

      if (!added) {
        newDevices.push(newDevice);
      }

      store.setState({
        discoveredDevices: newDevices,
        loading: false
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
