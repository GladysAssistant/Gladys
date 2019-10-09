import { RequestStatus } from '../../../../../utils/consts';
import createActionsIntegration from '../../../../../actions/integration';
import update from 'immutability-helper';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
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
    updateDeviceField(state, index, field, value) {
      const discoveredDevices = update(state.discoveredDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        discoveredDevices
      });
    },
    updateFeatureProperty(state, deviceIndex, featureIndex, property, value) {
      const discoveredDevices = update(state.discoveredDevices, {
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
        discoveredDevices
      });
    },
    async saveDevice(state, index) {
      const device = state.discoveredDevices[index];
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      savedDevice.model = device.model;
      const discoveredDevices = update(state.discoveredDevices, {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        discoveredDevices
      });
    }
  };

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
