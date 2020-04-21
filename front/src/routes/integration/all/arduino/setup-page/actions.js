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
    updateArduinoPath(state, e) {
      store.setState({
        arduinoPath: e.target.value
      });
    },
    async savePathAndConnect(state) {
      store.setState({
        connectArduinoStatus: RequestStatus.Getting,
        arduinoDriverFailed: false
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_PATH', {
          value: state.zwaveDriverPath
        });
        await state.httpClient.post('/api/v1/service/arduino/connect');
        store.setState({
          connectArduinoStatus: RequestStatus.Success,
          arduinoConnectionInProgress: true
        });
      } catch (e) {
        store.setState({
          connectArduinoStatus: RequestStatus.Error
        });
      }
    },
    async disconnect(state) {
      store.setState({
        arduinoDisconnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/disconnect');
        await actions.getStatus(store.getState());
        store.setState({
          arduinoDisconnectStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          arduinoDisconnectStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
};

export default actions;
