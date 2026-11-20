import { DeviceGetByRoomStatus } from '../utils/consts';
import update from 'immutability-helper';
import { sendDeviceFeatureValue } from '../utils/deviceCommand';

function createActions(store) {
  const actions = {
    async getDevicesByRoom(state) {
      store.setState({
        DeviceGetStatus: DeviceGetByRoomStatus.Getting
      });
      try {
        const rooms = await state.httpClient.get('/api/v1/room', { expand: 'devices' });
        store.setState({
          rooms,
          DeviceGetStatus: DeviceGetByRoomStatus.Success
        });
      } catch (e) {
        store.setState({
          DeviceGetStatus: DeviceGetByRoomStatus.Error
        });
      }
    },
    collapseRoom(state, e, roomIndex) {
      e.preventDefault();
      const newState = update(state, {
        rooms: {
          [roomIndex]: {
            collapsed: {
              $set: !state.rooms[roomIndex].collapsed
            }
          }
        }
      });
      store.setState(newState);
    },
    async setValue(state, deviceFeatureSelector, value) {
      await sendDeviceFeatureValue(state.httpClient, deviceFeatureSelector, value);
    },
    async updateValue(state, device, deviceFeature, roomIndex, deviceIndex, deviceFeatureIndex, value) {
      actions.updateLocalValue(state, roomIndex, deviceIndex, deviceFeatureIndex, value);
      if (deviceFeature.category === 'light' && deviceFeature.type === 'binary') {
        await sendDeviceFeatureValue(state.httpClient, deviceFeature.selector, value);
      }
    },
    updateLocalValue(state, roomIndex, deviceIndex, deviceFeatureIndex, value) {
      // create a new immutable state
      const newState = update(state, {
        rooms: {
          [roomIndex]: {
            devices: {
              [deviceIndex]: {
                features: {
                  [deviceFeatureIndex]: {
                    last_value: {
                      $set: value
                    }
                  }
                }
              }
            }
          }
        }
      });

      store.setState(newState);
    }
  };
  return actions;
}

export default createActions;
