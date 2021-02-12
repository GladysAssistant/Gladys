import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let netatmoUsername;
      let netatmoPassword;
      let netatmoClientId;
      let netatmoClientSecret;
      let netatmoIsConnect;
      try {
        netatmoUsername = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_USERNAME');
        netatmoClientId = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID');
        netatmoIsConnect = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_IS_CONNECT');
        if (netatmoUsername.value) {
          netatmoPassword = '*********'; // need to fill the field
        }
        if (netatmoClientId.value) {
          netatmoClientSecret = '*********'; // need to fill the field
        } else {
          store.setState({
            connectNetatmoStatus: RequestStatus.ServiceNotConfigured,
            netatmoConnected: false
          });
        }
        if (netatmoIsConnect.value === 'connect') {
          store.setState({
            connectNetatmoStatus: RequestStatus.ServiceConnected,
            netatmoConnected: true
          });
        } else {
          store.setState({
            connectNetatmoStatus: RequestStatus.ServiceDisconnected,
            netatmoConnected: false
          });
        }
      } finally {
        store.setState({
          netatmoUsername: (netatmoUsername || {}).value,
          netatmoPassword,
          netatmoClientId: (netatmoClientId || {}).value,
          netatmoClientSecret
        });
      }
    },
    updateConfiguration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'netatmoPassword') {
        data.passwordChanges = true;
      }
      if (e.target.name === 'netatmoClientSecret') {
        data.clientSecretChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectNetatmoStatus: RequestStatus.Getting,
        netatmoConnected: false
      });
      try {
        await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_USERNAME', {
          value: state.netatmoUsername
        });
        if (state.passwordChanges) {
          await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_PASSWORD', {
            value: state.netatmoPassword
          });
        }
        await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID', {
          value: state.netatmoClientId
        });
        if (state.clientSecretChanges) {
          await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_CLIENT_SECRET', {
            value: state.netatmoClientSecret
          });
        }
        await state.httpClient.post('/api/v1/service/netatmo/variable/NETATMO_IS_CONNECT', { value: 'connect' });
        await state.httpClient.post(`/api/v1/service/netatmo/connect`);
        store.setState({
          connectNetatmoStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectNetatmoStatus: RequestStatus.Error,
          passwordChanges: false,
          clientSecretChanges: false
        });
      }
    },
    async disconnectAction(state) {
      event.preventDefault();
      store.setState({
        connectNetatmoStatus: RequestStatus.ServiceDisconnected,
        netatmoConnected: false
      });
      try {
        await state.httpClient.post(`/api/v1/service/netatmo/disconnect`);
        store.setState({
          disConnectNetatmoStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectNetatmoStatus: RequestStatus.Error,
          passwordChanges: false,
          clientSecretChanges: false
        });
      }
    },
    async displayConnectedMessage(state) {
      // display 3 seconds a message "NETATMO connected"
      const netatmoIsConnect = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_IS_CONNECT');
      if (netatmoIsConnect.value === 'connect') {
        store.setState({
          netatmoConnectedMessage: true,
          netatmoConnectedError: false,
          netatmoConnectionError: undefined,
          connectNetatmoStatus: RequestStatus.ServiceConnected,
          netatmoConnected: true
        });
      } else {
        store.setState({
          netatmoConnectedMessage: true,
          netatmoConnectedError: false,
          netatmoConnectionError: undefined,
          connectNetatmoStatus: RequestStatus.ServiceDisconnected,
          netatmoConnected: false
        });
      }
    },
    displayNetatmoError(state) {
      store.setState({
        netatmoConnectedMessage: false,
        netatmoConnectedError: true,
        connectNetatmoStatus: undefined
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
