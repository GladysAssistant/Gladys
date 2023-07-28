import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import createDeviceActions from '../../device';

const BOX_KEY = 'Vacbot';

function createActions(store) {
  const boxActions = createBoxActions(store);
  const deviceActions = createDeviceActions(store);

  const actions = {
    async getVacbotBoxDatas(state, box, x, y) {
      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {
        const status = await state.httpClient.get(`/api/v1/service/ecovacs/${box.device_feature}/status`);
        // api/v1/device/:device_selector
        const vacbotDevice = await state.httpClient.get(`/api/v1/device/${box.device_feature}`);
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbotStatus: status,
          device: vacbotDevice,
          status: RequestStatus.Success
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbotStatus: null,
          device: null,
          status: RequestStatus.Error
        });
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    },
    
    
    async setValueDevice(state, deviceFeatureSelector, action) {
      await deviceActions.setValue(state, deviceFeatureSelector, action);
    },

    // From DeviceBox (with state, data)
    async updateValueWithDebounce(state, x, y, device, deviceFeature, deviceIndex, featureIndex, value)  {
      const devices = updateDevices(state.devices, deviceFeature.selector, value, new Date());
      this.setState({
        devices
      });
      await this.setValueDeviceDebounce(deviceFeature, value);
    },
    /* From devicesInRoom actions
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
    */
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

    deviceFeatureWebsocketEvent(state, box, x, y, payload) {
      if (box.vacbot === payload.device) {
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          vacbot: payload.last_value_string
        });
      }
    },
    /*
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
    */
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
    },
  };

    
  return Object.assign({}, actions);
}

export default createActions;
