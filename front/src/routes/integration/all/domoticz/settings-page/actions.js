import { RequestStatus } from '../../../../../utils/consts';

const actions = store => {
  const actions = {
    async getCurrentDomoticzServerAddress(state) {
      store.setState({
        getCurrentDomoticzServerAddressStatus: RequestStatus.getting
      });
      try {
        const variable = await state.httpClient.get('/api/v1/service/domoticz/variable/DOMOTICZ_SERVER_ADDRESS');
        store.setState({
          domoticzServerAddress: variable.value,
          getCurrentDomoticzServerAddressStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentDomoticzServerAddressStatus: RequestStatus.Error
        });
      }
    },
    updateDomoticzServerAddress(state, e) {
      store.setState({
        domoticzServerAddress: e.target.value
      });
    },
    async getCurrentDomoticzServerPort(state) {
      store.setState({
        getCurrentDomoticzServerPortStatus: RequestStatus.getting
      });
      try {
        const variable = await state.httpClient.get('/api/v1/service/domoticz/variable/DOMOTICZ_SERVER_PORT');
        store.setState({
          domoticzServerPort: variable.value,
          getCurrentDomoticzServerPortStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          getCurrentDomoticzServerPortStatus: RequestStatus.Error
        });
      }
    },
    updateDomoticzServerPort(state, e) {
      store.setState({
        domoticzServerPort: e.target.value
      });
    },
    async saveServerAndConnect(state) {
      store.setState({
        connectDomoticzStatus: RequestStatus.Getting,
        domoticzVersion: null,
        domoticzStatus: 'connecting'
      });
      try {
        await state.httpClient.post('/api/v1/service/domoticz/variable/DOMOTICZ_SERVER_ADDRESS', {
          value: state.domoticzServerAddress
        });
        await state.httpClient.post('/api/v1/service/domoticz/variable/DOMOTICZ_SERVER_PORT', {
          value: state.domoticzServerPort
        });
        await state.httpClient.post('/api/v1/service/domoticz/connect');
        store.setState({
          connectDomoticzStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectDomoticzStatus: RequestStatus.Error
        });
      }
    },
    async connect(state) {
      store.setState({
        connectDomoticzStatus: RequestStatus.Getting,
        domoticzVersion: null,
        domoticzStatus: 'connecting'
      });
      try {
        await state.httpClient.post('/api/v1/service/domoticz/connect');
        store.setState({
          connectDomoticzStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectDomoticzStatus: RequestStatus.Error
        });
      }
    },
    async disconnect(state) {
      store.setState({
        domoticzDisconnectStatus: RequestStatus.Getting,
        domoticzStatus: 'disconnected'
      });
      try {
        await state.httpClient.post('/api/v1/service/domoticz/disconnect');
        await actions.getStatus(store.getState());
        store.setState({
          domoticzDisconnectStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          domoticzDisconnectStatus: RequestStatus.Error
        });
      }
    },
    async getVersion(state) {
      store.getState({
        getDomoticzVersionStatus: RequestStatus.Getting,
        domoticzVersion: null
      });
      try {
        const data = await state.httpClient.get('/api/v1/service/domoticz/version');
        store.setState({
          getDomoticzVersionStatus: RequestStatus.Success,
          domoticzVersion: data
        });
      } catch (e) {
        store.setState({
          getDomoticzVersionStatus: RequestStatus.Error
        });
      }
    },

    // Listeners
    serverReady(state, payload) {
      store.setState({
        domoticzStatus: 'connected',
        domoticzVersion: payload
      });
    },
    serverFailed(state) {
      store.setState({
        domoticzStatus: 'failed',
        domoticzVersion: null
      });
    }
  };

  return actions;
};

export default actions;
