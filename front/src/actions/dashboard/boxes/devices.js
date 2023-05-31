import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import createDeviceActions from '../../device';
import update from 'immutability-helper';
import get from 'get-value';
import debounce from 'debounce';

const BOX_KEY = 'Devices';

function createActions(store) {
  const boxActions = createBoxActions(store);
  const deviceActions = createDeviceActions(store);

  const actions = {
    async getDevices(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const devices = await state.httpClient.get(`/api/v1/device`); //TODO Filter
        // we test if there are lights ON/OFF device features to control in this room

        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          devices
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    async setValueDevice(state, deviceFeatureSelector, action) {
      await deviceActions.setValue(state, deviceFeatureSelector, action);
    },
    async updateValue(state, x, y, device, deviceFeature, deviceIndex, featureIndex, action) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const newData = update(data, {
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
      });
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        devices: newData.devices
      });
      await deviceActions.setValue(state, deviceFeature.selector, action);
    },

    async updateValueWithDebounce(state, x, y, device, deviceFeature, deviceIndex, featureIndex, action) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const newData = update(data, {
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
      });
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        devices: newData.devices
      });
      await actions.setValueDeviceDebounce(state, deviceFeature.selector, action);
    },

    deviceFeatureWebsocketEvent(state, x, y, payload) {
      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const devices = get(data, 'devices');
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
              });
              boxActions.mergeBoxData(state, BOX_KEY, x, y, {
                devices: newData.devices
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
      const devices = get(data, 'devices');
      if (devices) {
        let found = false;
        let currentDeviceIndex = 0;
        let currentFeatureIndex = 0;
        while (!found && currentDeviceIndex < devices.length) {
          while (!found && currentFeatureIndex < devices[currentDeviceIndex].features.length) {
            if (devices[currentDeviceIndex].features[currentFeatureIndex].selector === payload.device_feature) {
              found = true;
              const newData = update(data, {
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
              });
              boxActions.mergeBoxData(state, BOX_KEY, x, y, {
                devices: newData.devices
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
