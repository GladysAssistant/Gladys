import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getMqttDevices(state) {
      store.setState({
        getMqttDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getMqttDeviceOrderDir || 'asc'
        };
        if (state.mqttDeviceSearch && state.mqttDeviceSearch.length) {
          options.search = state.mqttDeviceSearch;
        }
        const mqttDevices = await state.httpClient.get('/api/v1/service/mqtt/device', options);
        store.setState({
          mqttDevices,
          getMqttDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          mqttDevices: [],
          getMqttDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        mqttDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        mqttDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        mqttDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        mqttDeviceSearch: e.target.value
      });
      await actions.getMqttDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({
        getMqttDeviceOrderDir: e.target.value
      });
      await actions.getMqttDevices(store.getState());
    },
    addDeviceFeature(state, index, category, type) {
      const uniqueId = uuid.v4();
      const mqttDevices = update(state.mqttDevices, {
        [index]: {
          features: {
            $push: [
              {
                id: uniqueId,
                category,
                type,
                read_only: true,
                has_feedback: false
              }
            ]
          }
        }
      });

      store.setState({
        mqttDevices
      });
    },
    updateFeatureProperty(state, deviceIndex, featureIndex, property, value) {
      const mqttDevices = update(state.mqttDevices, {
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
        mqttDevices
      });
    },
    deleteFeature(state, deviceIndex, featureIndex) {
      const mqttDevices = update(state.mqttDevices, {
        [deviceIndex]: {
          features: {
            $splice: [[featureIndex, 1]]
          }
        }
      });

      store.setState({
        mqttDevices
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
