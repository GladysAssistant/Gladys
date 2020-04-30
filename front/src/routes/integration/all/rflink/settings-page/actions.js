import { RequestStatus } from '../../../../../utils/consts';

const actions = store => {
  const actions = {
    async getUsbPorts(state) {
      store.setState({
        getRflinkUsbPortStatus: RequestStatus.Getting
      });
      try {
        const usbPorts = await state.httpClient.get('/api/v1/service/usb/port');
        store.setState({
          usbPorts,
          getRflinkUsbPortStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getRflinkUsbPortStatus: RequestStatus.Error
        });
      }
    },
    async getCurrentRflinkPath(state) {
      store.setState({
        getCurrentRflinkPathStatus: RequestStatus.Getting
      });
      try {
        const RflinkPath = await state.httpClient.get('/api/v1/service/rflink/variable/RFLINK_PATH');
        store.setState({
          RflinkPath: RflinkPath.value,
          getCurrentRflinkPathStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentRflinkPathStatus: RequestStatus.Error
        });
      }
    },
    updateRflinkPath(state, e) {
      store.setState({
        RflinkPath: e.target.value
      });
    },
    updateDebugCommand(state, e) {
      store.setState({ commandToSend: e.target.value });
    },
    updateMilight(state, e) {
      store.setState({
        currentMilightGateway: e.target.value
      });
    },
    updateZone(state, e) {
      store.setState({
        currentMilightZone: e.target.value
      });
    },
    async saveDriverPathAndConnect(state) {
      store.setState({
        connectRflinkStatus: RequestStatus.Getting,
        rflinkFailed: false
      });
      console.log(state.RflinkPath)
      try {
        await state.httpClient.post('/api/v1/service/rflink/variable/RFLINK_PATH', {
          value: state.RflinkPath
        });
        await state.httpClient.post('/api/v1/service/rflink/connect');
        store.setState({
          connectRflinkStatus: RequestStatus.Success,
          rflinkConnectionInProgress: true
        });
      } catch (e) {
        store.setState({
          connectRflinkStatus: RequestStatus.Error
        });
      }
    },
    async disconnect(state) {
      store.setState({
        rflinkDisconnectStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/rflink/disconnect');
        await actions.getStatus(store.getState());
        store.setState({
          rflinkDisconnectStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          rflinkDisconnectStatus: RequestStatus.Error
        });
      }
    },
    async pair(state) {
      try {
        await state.httpClient.post('/api/v1/service/rflink/variable/CURRENT_MILIGHT_GATEWAY', {
          value: state.currentMilightGateway
        });
        await state.httpClient.post('/api/v1/service/rflink/pair', {
          zone: state.currentMilightZone
        });
      } catch (e) {}
    },
    async unpair(state) {
      try {
        await state.httpClient.post('/api/v1/service/rflink/variable/CURRENT_MILIGHT_GATEWAY', {
          value: state.currentMilightGateway
        });
        await state.httpClient.post('/api/v1/service/rflink/unpair', {
          zone: state.currentMilightZone
        });
      } catch (e) {}
    },
    async sendDebug(state) {
      try {
        await state.httpClient.post('/api/v1/service/rflink/debug', {
          value: state.commandToSend
        });
      } catch (e) {}
    },
    async getStatus(state) {
      store.setState({
        rflinkGetStatusStatus: RequestStatus.Getting
      });
      try {
        const rflinkStatus = await state.httpClient.get('/api/v1/service/rflink/status');
        let currentMilightGateway = rflinkStatus.currentMilightGateway;
        if (currentMilightGateway === undefined || currentMilightGateway === null) {
          currentMilightGateway = 'error';
        }

        store.setState({
          rflinkStatus,
          currentMilightGateway,
          rflinkConnectionInProgress: false,
          rflinkGetStatusStatus: RequestStatus.Success
        });
        return rflinkStatus;
      } catch (e) {
        store.setState({
          rflinkGetStatusStatus: RequestStatus.Error,
          rflinkConnectionInProgress: false
        });
      }
    },
    driverFailed(state) {
      store.setState({
        rflinkFailed: true,
        rflinkConnectionInProgress: false
      });
    }
  };

  return actions;
};

export default actions;
