import update from 'immutability-helper';

import { RequestStatus } from '../../../../../utils/consts';
import createActionsHouse from '../../../../../actions/house';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
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
  return Object.assign({}, houseActions, actions);
}

export default createActions;
