import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';
import createActionsHouse from '../../../../../actions/house';

const createActions = store => {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getDiscoveredDevices(state) {
      store.setState({
        lanManagerGetDiscoveredDevicesStatus: RequestStatus.Getting
      });
      try {
        const { filterExisting = false } = state;
        const lanManagerDiscoveredDevices = await state.httpClient.get('/api/v1/service/lan-manager/discover', {
          filterExisting
        });
        store.setState({
          lanManagerDiscoveredDevices,
          lanManagerGetDiscoveredDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          lanManagerGetDiscoveredDevicesStatus: RequestStatus.Error
        });
      }
    },
    async toggleFilterOnExisting(state) {
      const { filterExisting = false } = state;
      store.setState({
        filterExisting: !filterExisting
      });

      await actions.getDiscoveredDevices(store.getState());
    },
    async getLanManagerStatus(state) {
      let lanManagerStatus = {};
      try {
        lanManagerStatus = await state.httpClient.get('/api/v1/service/lan-manager/status');
      } finally {
        store.setState({
          lanManagerStatus
        });
      }
    },
    async scan(state) {
      store.setState({
        lanManagerGetDiscoveredDevicesStatus: RequestStatus.Getting
      });

      try {
        await state.httpClient.post('/api/v1/service/lan-manager/discover');
      } catch (e) {
        store.setState({
          lanManagerGetDiscoveredDevicesStatus: RequestStatus.Error
        });
      }
    },
    async handleStatus(state, status) {
      store.setState({
        lanManagerStatus: status
      });

      if (!status.scanning) {
        await actions.getDiscoveredDevices(store.getState());
      }
    },
    async saveDevice(state, deviceIndex) {
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
