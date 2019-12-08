import update from 'immutability-helper';
import debounce from 'debounce';
import uuid from 'uuid';
import { RequestStatus } from '../../../../utils/consts';
import createActionsIntegration from '../../../../actions/integration';
import { fillFeatures } from './device-page/models';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getSonoffDevices(state, take, skip) {
      store.setState({
        getSonoffStatus: RequestStatus.Getting
      });
      try {
        const options = {
          order_dir: state.getSonoffOrderDir || 'asc',
          take,
          skip
        };
        if (state.sonoffSearch && state.sonoffSearch.length) {
          options.search = state.sonoffSearch;
        }

        const sonoffsReceived = await state.httpClient.get('/api/v1/service/sonoff/device', options);
        let sonoffDevices;
        if (skip === 0) {
          sonoffDevices = sonoffsReceived;
        } else {
          sonoffDevices = update(state.sonoffDevices, {
            $push: sonoffsReceived
          });
        }
        store.setState({
          sonoffDevices,
          getSonoffStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          philipsHueGetBridgesStatus: RequestStatus.Error,
          getSonoffStatus: e.message
        });
      }
    },
    async getDiscoveredSonoffDevices(state) {
      store.setState({
        loading: true
      });
      try {
        const discoveredDevices = await state.httpClient.get('/api/v1/service/sonoff/discover');
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
    addDevice(state) {
      const uniqueId = uuid.v4();
      const sonoffDevices = update(state.sonoffDevices, {
        $push: [
          {
            id: uniqueId,
            name: null,
            should_poll: false,
            service_id: state.currentIntegration.id,
            external_id: 'sonoff:'
          }
        ]
      });
      store.setState({
        sonoffDevices
      });
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
      device.selector = device.external_id;

      fillFeatures(device);

      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      const devices = update(state[listName], {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        [listName]: devices
      });
    },
    async deleteDevice(state, index) {
      const device = state.sonoffDevices[index];
      if (device.created_at) {
        await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      }
      const sonoffDevices = update(state.sonoffDevices, {
        $splice: [[index, 1]]
      });
      store.setState({
        sonoffDevices
      });
    },
    async search(state, e) {
      store.setState({
        sonoffSearch: e.target.value
      });
      await actions.getSonoffDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getSonoffOrderDir: e.target.value
      });
      await actions.getSonoffDevices(store.getState(), 20, 0);
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
