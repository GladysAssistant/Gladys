import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import createDeviceActions from '../../device';
import update from 'immutability-helper';
import get from 'get-value';
import debounce from 'debounce';
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../../server/utils/constants');

const BOX_KEY = 'DevicesInRoom';

const getLightStatus = room => {
  let roomLightStatus = 0;
  room.devices.forEach(device => {
    device.features.forEach(feature => {
      // if it's a light
      const isLight =
        feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
        feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY &&
        feature.read_only === false;
      // if it's a light and it's turned on, we consider that the light
      // is on in the room
      if (isLight && feature.last_value === 1) {
        roomLightStatus = 1;
      }
    });
  });
  return {
    roomLightStatus
  };
};

function createActions(store) {
  const boxActions = createBoxActions(store);
  const deviceActions = createDeviceActions(store);

  const actions = {
    async getDevicesInRoom(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const room = await state.httpClient.get(`/api/v1/room/${box.room}?expand=devices`);
        // we test if there are lights ON/OFF device features to control in this room
        const { roomLightStatus } = getLightStatus(room);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          room,
          roomLightStatus
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    async changeAllLightsStatusRoom(state, x, y, action) {
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        roomLightStatus: action
      });
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const promises = [];
      data.room.devices.forEach(device => {
        device.features.forEach(feature => {
          const isLightBinary =
            feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT && feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY;
          if (isLightBinary) {
            promises.push(deviceActions.setValue(state, feature.selector, action));
            feature.last_value = action;
            feature.last_value_changed = new Date();
          }
        });
      });
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        room: data.room
      });
      await Promise.all(promises);
    },
    async setValueDevice(state, deviceFeatureSelector, action) {
      await deviceActions.setValue(state, deviceFeatureSelector, action);
    },
    async updateValueWithDebounce(state, x, y, device, deviceFeature, deviceIndex, featureIndex, action) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const newData = update(data, {
        room: {
          devices: {
            [deviceIndex]: {
              features: {
                [featureIndex]: {
                  last_value: {
                    $set: action
                  },
                  last_value_changed: {
                    $set: new Date()
                  }
                }
              }
            }
          }
        }
      });
      const { roomLightStatus } = getLightStatus(newData.room);
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        room: newData.room,
        roomLightStatus
      });
      await actions.setValueDeviceDebounce(state, deviceFeature.selector, action);
    },
    async updateValue(state, x, y, device, deviceFeature, deviceIndex, featureIndex, action) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const newData = update(data, {
        room: {
          devices: {
            [deviceIndex]: {
              features: {
                [featureIndex]: {
                  last_value: {
                    $set: action
                  },
                  last_value_changed: {
                    $set: new Date()
                  }
                }
              }
            }
          }
        }
      });
      const { roomLightStatus } = getLightStatus(newData.room);
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        room: newData.room,
        roomLightStatus
      });
      await deviceActions.setValue(state, deviceFeature.selector, action);
    },
    deviceFeatureWebsocketEvent(state, x, y, payload) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const devices = get(data, 'room.devices');
      if (devices) {
        let found = false;
        let currentDeviceIndex = 0;
        let currentFeatureIndex = 0;
        while (!found && currentDeviceIndex < devices.length) {
          while (!found && currentFeatureIndex < devices[currentDeviceIndex].features.length) {
            if (
              devices[currentDeviceIndex].features[currentFeatureIndex].selector === payload.device_feature_selector
            ) {
              found = true;
              const newData = update(data, {
                room: {
                  devices: {
                    [currentDeviceIndex]: {
                      features: {
                        [currentFeatureIndex]: {
                          last_value: {
                            $set: payload.last_value
                          },
                          last_value_changed: {
                            $set: payload.last_value_changed
                          }
                        }
                      }
                    }
                  }
                }
              });
              const { roomLightStatus } = getLightStatus(newData.room);
              boxActions.mergeBoxData(state, BOX_KEY, x, y, {
                room: newData.room,
                roomLightStatus
              });
            }
            currentFeatureIndex += 1;
          }
          currentDeviceIndex += 1;
          currentFeatureIndex = 0;
        }
      }
    },
    deviceFeatureStringStateWebsocketEvent(state, x, y, payload) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const devices = get(data, 'room.devices');
      if (devices) {
        let found = false;
        let currentDeviceIndex = 0;
        let currentFeatureIndex = 0;
        while (!found && currentDeviceIndex < devices.length) {
          while (!found && currentFeatureIndex < devices[currentDeviceIndex].features.length) {
            if (devices[currentDeviceIndex].features[currentFeatureIndex].selector === payload.device_feature) {
              found = true;
              const newData = update(data, {
                room: {
                  devices: {
                    [currentDeviceIndex]: {
                      features: {
                        [currentFeatureIndex]: {
                          last_value_string: {
                            $set: payload.last_value_string
                          },
                          last_value_changed: {
                            $set: payload.last_value_changed
                          }
                        }
                      }
                    }
                  }
                }
              });
              boxActions.mergeBoxData(state, BOX_KEY, x, y, {
                room: newData.room
              });
            }
            currentFeatureIndex += 1;
          }
          currentDeviceIndex += 1;
          currentFeatureIndex = 0;
        }
      }
    }
  };
  actions.setValueDeviceDebounce = debounce(actions.setValueDevice, 500);
  return Object.assign({}, actions, boxActions);
}

export default createActions;
