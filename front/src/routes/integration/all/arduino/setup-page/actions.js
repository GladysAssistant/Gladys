import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';

const actions = store => {
  const actions = {
    async getUsbPorts(state) { //getUsbPorts --> Fonctionnel !
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
