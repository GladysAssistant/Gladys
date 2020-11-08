import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';

let scanTimer;

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async discover(state) {
      store.setState({
        discoverZigbee2mqtt: true
      });
      try {
        await state.httpClient.post('/api/v1/service/zigbee2mqtt/discover');
        scanTimer = setTimeout(store.setState, 5000, {
          discoverZigbee2mqtt: false,
          discoverZigbee2mqttError: 'integration.zigbee2mqtt.discover.noResponse'
        });
      } catch (e) {
        store.setState({
          discoverZigbee2mqtt: false,
          discoverZigbee2mqttError: 'integration.zigbee2mqtt.discover.serverNoResponse'
        });
      }
    },
    setDiscoveredDevices(state, zigbee2mqttDevices) {
      clearTimeout(scanTimer);
      store.setState({
        zigbee2mqttDevices,
        discoverZigbee2mqtt: false,
        discoverZigbee2mqttError: null
      });
    },
    async getHostIP(state) {
      const value = await state.httpClient.get('/api/v1/service/zigbee2mqtt/host_ip');
      const HostIP = "http://"+value+":8080"
      store.setState({
        zigbee2mqttFrontend: HostIP
      });
    },
    async getPermitJoin(state) {
      const value = await state.httpClient.get('/api/v1/service/zigbee2mqtt/permit_join');
      store.setState({
        permitJoin: !!value
      });
    },
    async togglePermitJoin(state) {
      await state.httpClient.post('/api/v1/service/zigbee2mqtt/permit_join');
    },
    updatePermitJoin(state, value) {
      store.setState({
        permitJoin: value
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
        feature.name = feature.category.charAt(0).toUpperCase() + feature.category.slice(1);
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
