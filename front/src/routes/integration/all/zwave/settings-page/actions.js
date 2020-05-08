import { RequestStatus } from '../../../../../utils/consts';

const actions = store => {
  const actions = {
    async getUsbPorts(state) {
      store.setState({
        getZwaveUsbPortStatus: RequestStatus.Getting
      });
      try {
        const usbPorts = await state.httpClient.get('/api/v1/service/usb/port');
        store.setState({
          usbPorts,
          getZwaveUsbPortStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getZwaveUsbPortStatus: RequestStatus.Error
        });
      }
    },
    async getCurrentZwaveDriverPath(state) {
      store.setState({
        getCurrentZwaveDriverPathStatus: RequestStatus.Getting
      });
      try {
        const zwaveDriverPath = await state.httpClient.get('/api/v1/service/zwave/variable/ZWAVE_DRIVER_PATH');
        store.setState({
          zwaveDriverPath: zwaveDriverPath.value,
          getCurrentZwaveDriverPathStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentZwaveDriverPathStatus: RequestStatus.Error
        });
      }
    },
    updateZwaveDriverPath(state, driver) {
      store.setState({
        zwaveDriverPath: driver.value
      });
    },
    async saveDriverPathAndConnect(state) {
      store.setState({
        connectZwaveStatus: RequestStatus.Getting,
        zwaveDriverFailed: false
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/variable/ZWAVE_DRIVER_PATH', {
          value: state.zwaveDriverPath
        });
        await state.httpClient.post('/api/v1/service/zwave/connect');
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
        const zwaveInfos = await state.httpClient.get('/api/v1/service/zwave/info');
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
        zwaveDisconnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/disconnect');
        await actions.getStatus(store.getState());
        store.setState({
          zwaveDisconnectStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveDisconnectStatus: RequestStatus.Error
        });
      }
    },
    async getStatus(state) {
      store.setState({
        zwaveGetStatusStatus: RequestStatus.Getting
      });
      try {
        const zwaveStatus = await state.httpClient.get('/api/v1/service/zwave/status');
        store.setState({
          zwaveStatus,
          zwaveConnectionInProgress: false,
          zwaveGetStatusStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveGetStatusStatus: RequestStatus.Error,
          zwaveConnectionInProgress: false
        });
      }
    },
    driverFailed(state) {
      store.setState({
        zwaveDriverFailed: true,
        zwaveConnectionInProgress: false
      });
    }
  };

  return actions;
};

export default actions;
