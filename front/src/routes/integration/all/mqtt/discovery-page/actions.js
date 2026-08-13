import update from 'immutability-helper';
import createActionsHouse from '../../../../../actions/house';

const filterExistingDevices = (devices) => devices.filter((device) => device.id === undefined || device.updatable);

function createActions(store) {
  const houseActions = createActionsHouse(store);
  // Bumped by every websocket update and by every new request, so a response that resolves
  // after either of them is discarded instead of overwriting the list with older data
  let discoveryRevision = 0;
  const actions = {
    async getDiscoveredDevices(state) {
      discoveryRevision += 1;
      const requestRevision = discoveryRevision;
      store.setState({
        mqttDiscoveryLoading: true,
        mqttDiscoveryError: null,
      });
      try {
        const { mqttDiscoveryFilterExisting = true } = state;
        const mqttDiscoveredDevices = await state.httpClient.get('/api/v1/service/mqtt/discovery', {
          filter_existing: mqttDiscoveryFilterExisting,
        });
        if (discoveryRevision !== requestRevision) {
          return;
        }
        store.setState({ mqttDiscoveredDevices, mqttDiscoveryLoading: false });
      } catch (e) {
        if (discoveryRevision !== requestRevision) {
          return;
        }
        store.setState({
          mqttDiscoveredDevices: [],
          mqttDiscoveryLoading: false,
          mqttDiscoveryError: 'integration.mqtt.discover.serverError',
        });
      }
    },
    async toggleFilterOnExisting(state = {}) {
      const { mqttDiscoveryFilterExisting = true } = state;
      store.setState({
        mqttDiscoveryFilterExisting: !mqttDiscoveryFilterExisting,
      });
      await actions.getDiscoveredDevices(store.getState());
    },
    setDiscoveredDevices(state = {}, incomingDevices) {
      discoveryRevision += 1;
      const { mqttDiscoveryFilterExisting = true } = state;
      let mqttDiscoveredDevices = incomingDevices;
      if (incomingDevices && mqttDiscoveryFilterExisting) {
        mqttDiscoveredDevices = filterExistingDevices(incomingDevices);
      }
      store.setState({
        mqttDiscoveredDevices,
        mqttDiscoveryLoading: false,
        mqttDiscoveryError: null,
      });
    },
    updateDeviceField(state, externalId, field, value) {
      // The list can be re-ordered by live websocket updates, so devices
      // are resolved by external_id instead of their index
      const index = state.mqttDiscoveredDevices.findIndex((d) => d.external_id === externalId);
      if (index === -1) {
        return;
      }
      const mqttDiscoveredDevices = update(state.mqttDiscoveredDevices, {
        [index]: {
          [field]: {
            $set: value,
          },
        },
      });
      store.setState({
        mqttDiscoveredDevices,
      });
    },
    async saveDevice(state, externalId) {
      const device = state.mqttDiscoveredDevices.find((d) => d.external_id === externalId);
      if (!device) {
        return;
      }
      const savedDevice = await state.httpClient.post(`/api/v1/device`, device);
      // Discovery updates are pushed live over websocket, so the list may have been replaced
      // while the device was being saved: the current list is read back from the store
      const { mqttDiscoveredDevices: currentDevices = [] } = store.getState();
      const mqttDiscoveredDevices = currentDevices.filter((d) => d.external_id !== savedDevice.external_id);
      store.setState({
        mqttDiscoveredDevices,
      });
    },
  };

  return Object.assign({}, houseActions, actions);
}

export default createActions;
