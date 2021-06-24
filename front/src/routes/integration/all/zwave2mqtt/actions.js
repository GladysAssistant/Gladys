import update from 'immutability-helper';
import debounce from 'debounce';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async checkStatus(state) {
      let zwave2mqttStatus = {
        zwave2mqttConfigured: false,
        mqttExist: false,
        mqttRunning: false,
        zwave2mqttExist: false,
        zwave2mqttRunning: false,
        gladysConnected: false,
        zwave2mqttConnected: false,
        z2mEnabled: false,
        dockerBased: false,
        networkModeValid: false
      };
      try {
        zwave2mqttStatus = await state.httpClient.get('/api/v1/service/zwave2mqtt/status');
      } finally {
        store.setState({
          mqttExist: zwave2mqttStatus.mqttExist,
          mqttRunning: zwave2mqttStatus.mqttRunning,
          zwave2mqttExist: zwave2mqttStatus.zwave2mqttExist,
          zwave2mqttRunning: zwave2mqttStatus.zwave2mqttRunning,
          zwave2mqttConfigured: zwave2mqttStatus.zwave2mqttConfigured,
          zwave2mqttConnected: zwave2mqttStatus.zwave2mqttConnected,
          gladysConnected: zwave2mqttStatus.gladysConnected,
          z2mEnabled: zwave2mqttStatus.z2mEnabled,
          dockerBased: zwave2mqttStatus.dockerBased,
          networkModeValid: zwave2mqttStatus.networkModeValid
        });
      }
    },
    async getZwave2mqttDevices(state) {
      store.setState({
        getZwave2mqttStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getzwave2mqttOrderDir || 'asc'
        };
        if (state.zwave2mqttSearch && state.zwave2mqttSearch.length) {
          options.search = state.zwave2mqttSearch;
        }

        const zwave2mqttDevices = await state.httpClient.get('/api/v1/service/zwave2mqtt/device', options);
        store.setState({
          zwave2mqttDevices,
          getZwave2mqttStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          philipsHueGetBridgesStatus: RequestStatus.Error,
          getZwave2mqttStatus: e.message
        });
      }
    },
    async getDiscoveredZwave2mqttDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get(`/api/v1/service/zwave2mqtt/device`);
        store.setState({
          discoveredDevices,
          loading: false,
          errorLoading: false
        });
      } catch (e) {
        store.setState({
          discoveredDevices: undefined,
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
      const device = state.zwave2mqttDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const zwave2mqttDevices = update(state.zwave2mqttDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        zwave2mqttDevices
      });
    },
    async search(state, e) {
      store.setState({
        zwave2mqttSearch: e.target.value
      });
      await actions.getZwave2mqttDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getzwave2mqttOrderDir: e.target.value
      });
      await actions.getZwave2mqttDevices(store.getState());
    },
    async searchDevices(state, options = undefined) {
      store.setState({
        loading: true
      });
      try {
        await state.httpClient.post(`/api/v1/service/zwave2mqtt/discover`, options);
        store.setState({
          discoveredDevices: [],
          errorLoading: false
        });

        setTimeout(store.setState, 10000, {
          loading: false
        });
      } catch (e) {
        store.setState({
          loading: false,
          errorLoading: true
        });
      }
    },
    async connectAndScan(state, deviceIndex, username, password) {
      const device = state.discoveredDevices[deviceIndex];
      const options = {
        singleAddress: device.external_id.replace('zwave2mqtt:', ''),
        username,
        password
      };
      await state.httpClient.post('/api/v1/service/zwave2mqtt/discover', options);
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
