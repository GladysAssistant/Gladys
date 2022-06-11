import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';

function createActions(store) {
  const actions = {
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
    async getBroadlinkPeripherals(state) {
      store.setState({
        getBroadlinkPeripheralsStatus: RequestStatus.Getting
      });
      try {
        const broadlinkPeripherals = await state.httpClient.get('/api/v1/service/broadlink/peripheral');
        store.setState({
          broadlinkPeripherals,
          getBroadlinkPeripheralsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          broadlinkPeripherals: [],
          getBroadlinkPeripheralsStatus: RequestStatus.Error
        });
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        broadlinkPeripherals: {
          [index]: {
            device: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });
      store.setState(newState);
    },
    async saveDevice(state, index) {
      const { device } = state.broadlinkPeripherals[index];
      const savedDevice = await state.httpClient.post('/api/v1/device', device);

      const newState = update(state, {
        broadlinkPeripherals: {
          [index]: {
            device: {
              $set: savedDevice
            }
          }
        }
      });
      store.setState(newState);
    }
  };
  return Object.assign({}, actions);
}

export default createActions;
