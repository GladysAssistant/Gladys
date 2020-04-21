import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';

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
    async saveDevice(state) {
      const savedDevice = await state.httpClient.post('/api/v1/device', device);
      const newState = update(state, {
        ArduinoDevices: {
          $splice: [[index, 1, savedDevice]]
        }
      });
      store.setState(newState);
    }
  };

  return actions;
};

export default actions;
