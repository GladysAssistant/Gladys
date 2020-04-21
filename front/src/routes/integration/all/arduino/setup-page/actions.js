import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';

const actions = store => {
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
        //console.log(usbPorts);
      } catch (e) {
        store.setState({
          getArduinoUsbPortStatus: RequestStatus.Error
        });
      }
    },
    async getArduinoDevices(state) {
      store.setState({
        getArduinoDevicesStatus: RequestStatus.Getting
      });

      try {
        const options = {
          order_dir: state.getArduinoDeviceOrderDir || 'asc'
        };
        if (state.arduinoDeviceSearch && state.arduinoDeviceSearch.length) {
          options.search = state.arduinoDeviceSearch;
        }
        const arduinoDevicesReceived = await state.httpClient.get('/api/v1/service/arduino/device', options);
        //const arduinoDevices = arduinoDevicesReceived.filter(device => device.model !== BRIDGE_MODEL);
        const arduinoDevicesMap = new Map();
        arduinoDevices.forEach(device => arduinoDevicesMap.set(device.external_id, device));
        store.setState({
          arduinoDevices,
          arduinoDevicesMap,
          getArduinoDevicesStatus: RequestStatus.Success
        });
        actions.getArduinoNewDevices(store.getState());
      } catch (e) {
        store.setState({
          getArduinoDevicesStatus: RequestStatus.Error
        });
      }

    },
    async getArduinoNewDevices(state) {
      store.setState({
        getArduinoNewDevicesStatus: RequestStatus.Getting
      });
      try {
        const arduinoNewDevices = await state.httpClient.get('/api/v1/service/arduino/device');
        const arduinoNewDevicesFiltered = arduinoNewDevices.filter(device => {
          if (!state.arduinoDevicesMap) {
            return true;
          }
          return !state.arduinoDevicesMap.has(device.external_id);
        });
        store.setState({
          arduinoNewDevices: arduinoNewDevicesFiltered,
          getArduinoNewDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getArduinoNewDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      console.log(savedDevice);
      const newState = update(state, {
        arduinoDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    },
    async createDevice(state, device) {
      store.setState({
        getArduinoCreateDeviceStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/device', device);
        store.setState({
          getArduinoCreateDeviceStatus: RequestStatus.Success
        });
        actions.getArduinoDevices(store.getState());
      } catch (e) {
        store.setState({
          getArduinoCreateDeviceStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
};

export default actions;
