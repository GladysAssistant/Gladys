import { DeviceGetByRoomStatus } from '../utils/consts';
import update from 'immutability-helper';

function createActions(store) {
  const actions = {
    async getDevicesByRoom(state) {
      store.setState({
        DeviceGetStatus: DeviceGetByRoomStatus.Getting
      });
      try {
        const rooms = await state.httpClient.get('/api/v1/room?expand=devices');
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
    async turnOnLight(state, deviceSelector) {
      await state.httpClient.post(`/api/v1/light/${deviceSelector}/on`);
    },
    async turnOffLight(state, deviceSelector) {
      await state.httpClient.post(`/api/v1/light/${deviceSelector}/off`);
    },
    async updateValue(state, device, deviceFeature, roomIndex, deviceIndex, deviceFeatureIndex, value, oldValue) {
      actions.updateLocalValue(state, roomIndex, deviceIndex, deviceFeatureIndex, value);
      if (deviceFeature.category === 'light' && deviceFeature.type === 'binary') {
        await actions.turnOnLight(state, device.selector);
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
                    lastValue: {
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
