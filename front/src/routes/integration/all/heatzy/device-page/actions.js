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
    async getHeatzyDevices(state, take, skip) {
      store.setState({
        getHeatzyDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'heatzy',
          order_dir: state.getHeatzyDeviceOrderDir || 'asc',
          take,
          skip
        };
        if (state.heatzyDeviceSearch && state.heatzyDeviceSearch.length) {
          options.search = state.heatzyDeviceSearch;
        }
        const heatzyDevicesReceived = await state.httpClient.get('/api/v1/service/heatzy/device', options);
        let heatzyDevices;
        if (skip === 0) {
          heatzyDevices = heatzyDevicesReceived;
        } else {
          heatzyDevices = update(state.heatzyDevices, {
            $push: heatzyDevicesReceived
          });
        }
        store.setState({
          heatzyDevices,
          getHeatzyDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          heatzyDevices: [],
          getHeatzyDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        heatzyDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        heatzyDevices: {
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
        heatzyDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        heatzyDeviceSearch: e.target.value
      });
      await actions.getHeatzyDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getHeatzyDeviceOrderDir: e.target.value
      });
      await actions.getHeatzyDevices(store.getState(), 20, 0);
    },
    addDeviceFeature(state, index, category, type) {
      const uniqueId = uuid.v4();
      const heatzyDevices = update(state.heatzyDevices, {
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
        heatzyDevices
      });
    },
    updateFeatureProperty(state, deviceIndex, featureIndex, property, value) {
      const heatzyDevices = update(state.heatzyDevices, {
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
        heatzyDevices
      });
    },
    deleteFeature(state, deviceIndex, featureIndex) {
      const heatzyDevices = update(state.heatzyDevices, {
        [deviceIndex]: {
          features: {
            $splice: [[featureIndex, 1]]
          }
        }
      });

      store.setState({
        heatzyDevices
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
