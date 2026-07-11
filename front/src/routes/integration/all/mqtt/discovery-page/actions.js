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
    updateDeviceField(state, index, field, value) {
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
    async saveDevice(state, index) {
      const device = state.mqttDiscoveredDevices[index];
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
