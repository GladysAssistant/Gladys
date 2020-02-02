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
    async saveDriverPathAndConnect(state) {
      store.setState({
        connectArduinoStatus: RequestStatus.Getting,
        arduinoDriverFailed: false
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ZWAVE_DRIVER_PATH', {
          value: state.zwaveDriverPath
        });
        await state.httpClient.post('/api/v1/service/arduino/connect');
        store.setState({
          connectZwaveStatus: RequestStatus.Success,
          zwaveConnectionInProgress: true
        });
      } catch (e) {
        store.setState({
          connectZwaveStatus: RequestStatus.Error
        });
      }
    },
    async getInfos(state) {
      store.setState({
        getZwaveInfos: RequestStatus.Getting
      });
      try {
        const zwaveInfos = await state.httpClient.get('/api/v1/service/arduino/info');
        store.setState({
          zwaveInfos,
          getZwaveInfos: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getZwaveInfos: RequestStatus.Error
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
