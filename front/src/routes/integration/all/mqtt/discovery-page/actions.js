import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';

const filterExistingDevices = devices => devices.filter(device => device.id === undefined || device.updatable);

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getDiscoveredDevices(state) {
      store.setState({
        mqttDiscoveryLoading: true,
        mqttDiscoveryError: null
      });
      try {
        const { mqttDiscoveryFilterExisting = true } = state;
        const mqttDiscoveredDevices = await state.httpClient.get('/api/v1/service/mqtt/discovery', {
          filter_existing: mqttDiscoveryFilterExisting
        });
        store.setState({ mqttDiscoveredDevices, mqttDiscoveryLoading: false });
      } catch (e) {
        store.setState({
          mqttDiscoveredDevices: [],
          mqttDiscoveryLoading: false,
          mqttDiscoveryError: 'integration.mqtt.discover.serverError'
        });
      }
    },
    async toggleFilterOnExisting(state = {}) {
      const { mqttDiscoveryFilterExisting = true } = state;
      store.setState({
        mqttDiscoveryFilterExisting: !mqttDiscoveryFilterExisting
      });
      await actions.getDiscoveredDevices(store.getState());
    },
    setDiscoveredDevices(state = {}, incomingDevices) {
      const { mqttDiscoveryFilterExisting = true } = state;
      let mqttDiscoveredDevices = incomingDevices;
      if (incomingDevices && mqttDiscoveryFilterExisting) {
        mqttDiscoveredDevices = filterExistingDevices(incomingDevices);
      }
      store.setState({
        mqttDiscoveredDevices,
        mqttDiscoveryLoading: false,
        mqttDiscoveryError: null
      });
    },
    updateDeviceField(state, externalId, field, value) {
      // The list can be re-ordered by live websocket updates, so devices
      // are resolved by external_id instead of their index
      const index = state.mqttDiscoveredDevices.findIndex(d => d.external_id === externalId);
      if (index === -1) {
        return;
      }
      const mqttDiscoveredDevices = update(state.mqttDiscoveredDevices, {
        [index]: {
          [field]: {
            $set: value
          }
        }
      });
      store.setState({
        mqttDiscoveredDevices
      });
    },
    async saveDevice(state, externalId) {
      const device = state.mqttDiscoveredDevices.find(d => d.external_id === externalId);
      if (!device) {
        return;
      }
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      const mqttDiscoveredDevices = state.mqttDiscoveredDevices.filter(d => d.external_id !== savedDevice.external_id);
      store.setState({
        mqttDiscoveredDevices
      });
    }
  };

  return Object.assign({}, houseActions, actions);
}

export default createActions;
