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
    async getCurrentArduinoDriverPath(state) {
      store.setState({
        getCurrentArduinoDriverPathStatus: RequestStatus.Getting
      });
      try {
        const arduinoDriverPath = await state.httpClient.get('/api/v1/service/arduino/variable/ARDUINO_DRIVER_PATH');
        store.setState({
          arduinoDriverPath: arduinoDriverPath.value,
          getCurrentArduinoDriverPathStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentArduinoDriverPathStatus: RequestStatus.Error
        });
      }
    },
    updateArduinoDriverPath(state, e) {
      store.setState({
        arduinoDriverPath: e.target.value
      });
    },
    async saveDriverPathAndConnect(state) {
      store.setState({
        connectArduinoStatus: RequestStatus.Getting,
        arduinoDriverFailed: false
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_DRIVER_PATH', {
          value: state.arduinoDriverPath
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
    async getInfos(state) {
      store.setState({
        getArduinoInfos: RequestStatus.Getting
      });
      try {
        const arduinoInfos = await state.httpClient.get('/api/v1/service/arduino/info');
        store.setState({
          arduinoInfos,
          getArduinoInfos: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getArduinoInfos: RequestStatus.Error
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
    },
    async getStatus(state) {
      store.setState({
        arduinoGetStatusStatus: RequestStatus.Getting
      });
      try {
        const arduinoStatus = await state.httpClient.get('/api/v1/service/arduino/status');
        store.setState({
          arduinoStatus,
          arduinoConnectionInProgress: false,
          arduinoGetStatusStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          arduinoGetStatusStatus: RequestStatus.Error,
          arduinoConnectionInProgress: false
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
