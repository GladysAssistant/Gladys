import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';
import createActionsHouse from '../../../../../actions/house';
import createActionsIntegration from '../../../../../actions/integration';
import debounce from 'debounce';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async getUsbPorts(state) {
      store.setState({
        getArduinoUsbPortStatus: RequestStatus.Getting
      });
      try {
        const usbPorts = await state.httpClient.get('/api/v1/service/usb/port');
        store.setState({
          usbPorts,
          getArduinoUsbPortStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getArduinoUsbPortStatus: RequestStatus.Error
        });
      }
    },
    async getCurrentArduinoPath(state) {
      store.setState({
        getCurrentArduinoPathStatus: RequestStatus.Getting
      });
      try {
        const arduinoPath = await state.httpClient.get('/api/v1/service/arduino/variable/ARDUINO_PATH');
        store.setState({
          arduinoPath: arduinoPath.value,
          getCurrentArduinoPathStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentArduinoPathStatus: RequestStatus.Error
        });
      }
    },
    async checkConnected(state) {
      store.setState({
        getCurrentArduinoPathStatus: RequestStatus.Getting
      });
      try {
        await actions.getUsbPorts(store.getState());
        var connected = false;
        await actions.getCurrentArduinoPath(store.getState());
        const arduinoPath = store.getState().arduinoPath;

        if (arduinoPath !== "---------") {
          store.getState().usbPorts.forEach(element => {
            if (element.comPath === arduinoPath) {
              connected = true;
            }
          });

          if (connected) {
            store.setState({
              arduinoConnected: true
            });
          } else {
            store.setState({
              arduinoConnected: false
            });
          }
        } else {
          store.setState({
            arduinoConnected: false
          });
        }
      } catch (e) {
        store.setState({
          getCurrentArduinoPathStatus: RequestStatus.Error
        });
      }
      console.log(store.getState());
    },
    async getArduinoDevices(state, take, skip) {
      store.setState({
        getArduinoDevicesStatus: RequestStatus.Getting
      });
      try {
        const options = {
          service: 'arduino',
          order_dir: state.getArduinoDeviceOrderDir || 'asc',
          take,
          skip
        };
        if (state.arduinoDeviceSearch && state.arduinoDeviceSearch.length) {
          options.search = state.arduinoDeviceSearch;
        }
        const arduinoDevicesReceived = await state.httpClient.get('/api/v1/service/arduino/device', options);
        let arduinoDevices;
        if (skip === 0) {
          arduinoDevices = arduinoDevicesReceived;
        } else {
          arduinoDevices = update(state.arduinoDevices, {
            $push: arduinoDevicesReceived
          });
        }
        store.setState({
          arduinoDevices,
          getArduinoDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          arduinoDevices: [],
          getArduinoDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        arduinoDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        arduinoDevices: {
          [index]: {
            [property]: {
              $set: value
            }
          }
        }
      });
      store.setState(newState);
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete('/api/v1/device/' + device.selector);
      const newState = update(state, {
        arduinoDevices: {
          $splice: [[index, 1]]
        }
      });
      store.setState(newState);
    },
    async search(state, e) {
      store.setState({
        arduinoDeviceSearch: e.target.value
      });
      await actions.getArduinoDevices(store.getState(), 20, 0);
    },
    async changeOrderDir(state, e) {
      store.setState({
        getArduinoDeviceOrderDir: e.target.value
      });
      await actions.getArduinoDevices(store.getState(), 20, 0);
    },
    addDeviceFeature(state, index, category, type) {
      const uniqueId = uuid.v4();
      const arduinoDevices = update(state.arduinoDevices, {
        [index]: {
          features: {
            $push: [
              {
                id: uniqueId,
                category,
                type,
                read_only: true,
                has_feedback: false
              }
            ]
          }
        }
      });

      store.setState({
        arduinoDevices
      });
    },
    updateFeatureProperty(state, deviceIndex, featureIndex, property, value) {
      const arduinoDevices = update(state.arduinoDevices, {
        [deviceIndex]: {
          features: {
            [featureIndex]: {
              [property]: {
                $set: value
              }
            }
          }
        }
      });

      store.setState({
        arduinoDevices
      });
    },
    deleteFeature(state, deviceIndex, featureIndex) {
      const arduinoDevices = update(state.arduinoDevices, {
        [deviceIndex]: {
          features: {
            $splice: [[featureIndex, 1]]
          }
        }
      });

      store.setState({
        arduinoDevices
      });
    }
  };
  actions.debouncedSearch = debounce(actions.search, 200);
  return Object.assign({}, houseActions, integrationActions, actions);
}

export default createActions;
