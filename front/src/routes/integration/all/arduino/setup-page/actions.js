import { RequestStatus } from '../../../../../utils/consts';

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
        const arduinoPath = await state.httpClient.get('/api/v1/service/arduino/variable/ARDUINO_PATH');
        store.setState({
          arduinoPath: arduinoPath.value,
          getCurrentArduinoPathStatus: RequestStatus.Success
        });

        if (arduinoPath.value !== "---------"){
          store.setState({
            arduinoConnected: RequestStatus.Success
          });
        }else{
          store.setState({
            arduinoConnected: RequestStatus.Error
          });
        }
      } catch (e) {
        store.setState({
          getCurrentArduinoPathStatus: RequestStatus.Error
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
          value: state.arduinoPath
        });
        await state.httpClient.post('/api/v1/service/arduino/connect');
        store.setState({
          connectArduinoStatus: RequestStatus.Success,
          arduinoConnectionInProgress: true,
          arduinoConnected: RequestStatus.Success
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
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_PATH', {
          value: "---------"
        });
        await state.httpClient.post('/api/v1/service/arduino/disconnect');
        await actions.getStatus(store.getState());
        store.setState({
          arduinoDisconnectStatus: RequestStatus.Success,
          arduinoConnected:RequestStatus.Error
        });
      } catch (e) {
        store.setState({
          arduinoDisconnectStatus: RequestStatus.Error
        });
      }
    },
    driverFailed(state) {
      store.setState({
        arduinoDriverFailed: true,
        arduinoConnectionInProgress: false
      });
    }
  };

  return actions;
};

export default actions;
