import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';
import createActionsHouse from '../../../../../actions/house';

const createActions = store => {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getDiscoveredDevices(state = {}) {
      store.setState({
        sunspecGetDiscoveredDevicesStatus: RequestStatus.Getting
      });
      try {
        const { filterExisting = true } = state;
        const sunspecDiscoveredDevices = await state.httpClient.get('/api/v1/service/sunspec/discover', {
          filterExisting
        });
        store.setState({
          sunspecDiscoveredDevices,
          sunspecGetDiscoveredDevicesStatus: RequestStatus.Success,
          sunspecDiscoverUpdate: false
        });
      } catch (e) {
        console.error(e);
        store.setState({
          sunspecGetDiscoveredDevicesStatus: RequestStatus.Error
        });
      }
    },
    async toggleFilterOnExisting(state = {}) {
      const { filterExisting = true } = state;
      store.setState({
        filterExisting: !filterExisting
      });

      await actions.getDiscoveredDevices(store.getState());
    },
    async getSunSpecStatus(state) {
      let sunspecStatus = { scanning: false };
      try {
        sunspecStatus = await state.httpClient.get('/api/v1/service/sunspec/status');
      } finally {
        store.setState({
          sunspecStatus
        });
      }
    },
    async scan(state) {
      try {
        store.setState({
          sunspecStatus: { scanning: true }
        });
        await state.httpClient.post('/api/v1/service/sunspec/discover');
      } catch (e) {
        console.error(e);
        store.setState({
          sunspecStatus: { scanning: false }
        });
      }
    },
    async handleStatus(state = {}, sunspecStatus) {
      store.setState({
        sunspecStatus
      });

      const { sunspecDiscoveredDevices = [], sunspecGetDiscoveredDevicesStatus } = state;

      // when scan stops
      if (!sunspecStatus.scanning) {
        if (sunspecStatus.success === false) {
          store.setState({
            sunspecGetDiscoveredDevicesStatus: RequestStatus.Error
          });
        } else if (sunspecDiscoveredDevices.length === 0) {
          // if no device are currently fetched, refresh list
          await actions.getDiscoveredDevices(store.getState());
        } else if (sunspecStatus.deviceChanged) {
          // or display refresh button
          store.setState({
            sunspecDiscoverUpdate: true,
            sunspecGetDiscoveredDevicesStatus: RequestStatus.Success
          });
        }
      } else if (sunspecGetDiscoveredDevicesStatus !== RequestStatus.Getting) {
        store.setState({
          sunspecGetDiscoveredDevicesStatus: RequestStatus.Getting
        });
      }
    },
    async saveDevice(state = {}, deviceIndex) {
      const device = state.sunspecDiscoveredDevices[deviceIndex];

      try {
        const savedDevice = await state.httpClient.post('/api/v1/device', device);
        const newState = update(state, {
          sunspecDiscoveredDevices: {
            [deviceIndex]: {
              $set: savedDevice
            }
          }
        });
        store.setState(newState);
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        sunspecDiscoveredDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    }
  };
  return Object.assign({}, actions, houseActions);
};

export default createActions;
