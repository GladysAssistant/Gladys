import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';
import createActionsHouse from '../../../../../actions/house';

const createActions = store => {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getDiscoveredDevices(state = {}) {
      store.setState({
        lanManagerGetDiscoveredDevicesStatus: RequestStatus.Getting
      });
      try {
        const { filterExisting = true } = state;
        const lanManagerDiscoveredDevices = await state.httpClient.get('/api/v1/service/lan-manager/discover', {
          filterExisting
        });
        store.setState({
          lanManagerDiscoveredDevices,
          lanManagerGetDiscoveredDevicesStatus: RequestStatus.Success,
          lanManagerDiscoverUpdate: false
        });
      } catch (e) {
        console.error(e);
        store.setState({
          lanManagerGetDiscoveredDevicesStatus: RequestStatus.Error
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
    async getLanManagerStatus(state) {
      let lanManagerStatus = { scanning: false };
      try {
        lanManagerStatus = await state.httpClient.get('/api/v1/service/lan-manager/status');
      } finally {
        store.setState({
          lanManagerStatus
        });
      }
    },
    async scan(state) {
      let action;
      if (state.lanManagerStatus.scanning) {
        action = 'off';
      } else {
        action = 'on';
      }

      try {
        const lanManagerStatus = await state.httpClient.post('/api/v1/service/lan-manager/discover', { scan: action });
        store.setState({
          lanManagerStatus
        });
      } catch (e) {
        console.error(e);
        store.setState({
          lanManagerStatus: { scanning: false }
        });
      }
    },
    async handleStatus(state = {}, lanManagerStatus) {
      store.setState({
        lanManagerStatus
      });

      const { lanManagerDiscoveredDevices = [], lanManagerGetDiscoveredDevicesStatus } = state;

      // when scan stops
      if (!lanManagerStatus.scanning) {
        if (lanManagerStatus.success === false) {
          store.setState({
            lanManagerGetDiscoveredDevicesStatus: RequestStatus.Error
          });
        } else if (lanManagerDiscoveredDevices.length === 0) {
          // if no device are currently fetched, refresh list
          await actions.getDiscoveredDevices(store.getState());
        } else if (lanManagerStatus.deviceChanged) {
          // or display refresh button
          store.setState({
            lanManagerDiscoverUpdate: true,
            lanManagerGetDiscoveredDevicesStatus: RequestStatus.Success
          });
        }
      } else if (lanManagerGetDiscoveredDevicesStatus !== RequestStatus.Getting) {
        store.setState({
          lanManagerGetDiscoveredDevicesStatus: RequestStatus.Getting
        });
      }
    },
    async saveDevice(state = {}, deviceIndex) {
      const device = state.lanManagerDiscoveredDevices[deviceIndex];

      try {
        const savedDevice = await state.httpClient.post('/api/v1/device', device);
        const newState = update(state, {
          lanManagerDiscoveredDevices: {
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
        lanManagerDiscoveredDevices: {
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
