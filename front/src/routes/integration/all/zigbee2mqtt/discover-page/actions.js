import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getZigbee2mqttDevices(state) {
      store.setState({
        getZigbee2mqttStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/discover');
      } catch (e) {
        store.setState({
          getZigbee2mqttStatus: RequestStatus.Error
        });
      }
    },
    setDiscoveredDevices(state, zigbee2mqttDevices) {
      store.setState({
        zigbee2mqttDevices,
        getZigbee2mqttStatus: RequestStatus.Success
      });
    },
    updateDeviceField(state, index, field, value) {
      const zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        zigbee2mqttDevices
      });
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
    async saveDevice(state, index) {
      const device = state.zigbee2mqttDevices[index];
      device.features.forEach(feature => {
        feature.name = `${device.name} - ${feature.category}`;
      });
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      savedDevice.model = device.model;
      const zigbee2mqttDevices = update(state.zigbee2mqttDevices, {
        $splice: [[index, 1, savedDevice]]
      });
      store.setState({
        zigbee2mqttDevices
      });
    }
  };

  return Object.assign({}, integrationActions, actions);
}

export default createActions;
