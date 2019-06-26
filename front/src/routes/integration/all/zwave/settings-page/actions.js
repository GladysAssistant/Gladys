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
    updateZwaveDriverPath(state, e) {
      store.setState({
        zwaveDriverPath: e.target.value
      });
    },
    async saveDriverPathAndConnect(state) {
      store.setState({
        connectZwaveStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/zwave/variable/ZWAVE_DRIVER_PATH', {
          value: state.zwaveDriverPath
        });
        await state.httpClient.post('/api/v1/service/zwave/connect');
        store.setState({
          connectZwaveStatus: RequestStatus.Success
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
        store.setState({
          zwaveDisconnectStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          zwaveDisconnectStatus: RequestStatus.Error
        });
      }
    }
  };

  return actions;
};

export default actions;
