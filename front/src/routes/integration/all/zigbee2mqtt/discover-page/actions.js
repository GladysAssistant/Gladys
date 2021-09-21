import update from 'immutability-helper';
import createActionsIntegration from '../../../../../actions/integration';
import createActionsHouse from '../../../../../actions/house';

let scanTimer;

function createActions(store) {
  const integrationActions = createActionsIntegration(store);
  const houseActions = createActionsHouse(store);
  const actions = {
    async discover(state) {
      store.setState({
        discoverZigbee2mqtt: true,
        discoverZigbee2mqttError: null
      });
      if (state.session.websocketConnected) {
        try {
          await state.httpClient.post('/api/v1/service/zigbee2mqtt/discover');
          scanTimer = setTimeout(store.setState, 5000, {
            discoverZigbee2mqtt: false,
            discoverZigbee2mqttError: null
          });
        } catch (e) {
          clearTimeout(scanTimer);
          store.setState({
            zigbee2mqttDevices: [],
            discoverZigbee2mqtt: false,
            discoverZigbee2mqttError: 'integration.zigbee2mqtt.discover.serverNoResponse'
          });
        }
      } else {
        store.setState({
          zigbee2mqttDevices: [],
          discoverZigbee2mqtt: false,
          discoverZigbee2mqttError: 'integration.zigbee2mqtt.discover.serverNoResponseWebSocker'
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
    async getPermitJoin(state) {
      const value = await state.httpClient.get('/api/v1/service/zigbee2mqtt/permit_join');
      store.setState({
        permitJoin: value
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
    async checkStatus(state) {
      let zigbee2mqttStatus = {
        usbConfigured: false,
        mqttExist: false,
        mqttRunning: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        gladysConnected: false,
        zigbee2mqttConnected: false,
        z2mEnabled: false
      };
      try {
        zigbee2mqttStatus = await state.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      } finally {
        store.setState({
          gladysConnected: zigbee2mqttStatus.gladysConnected,
          zigbee2mqttConnected: zigbee2mqttStatus.zigbee2mqttConnected
        });
      }
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
    async saveDevice(state, index) {
      const device = state.zigbee2mqttDevices[index];
      device.features.forEach(feature => {
        const featureName = this.dictionary.deviceFeatureCategory[feature.category][feature.type];
        if (featureName) {
          feature.name = featureName;
        }
      });
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      const zigbee2mqttDevices = state.zigbee2mqttDevices.filter(d => d.external_id !== savedDevice.external_id);
      store.setState({
        zigbee2mqttDevices
      });
    }
  };

  return Object.assign({}, integrationActions, houseActions, actions);
}

export default createActions;
