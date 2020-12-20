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
      try {
        netatmoUsername = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_USERNAME');
        netatmoClientId = await state.httpClient.get('/api/v1/service/netatmo/variable/NETATMO_CLIENT_ID');
        if (netatmoUsername.value) {
          netatmoPassword = '*********'; // need to fill the field
        }
        if (netatmoClientId.value) {
          netatmoClientSecret = '*********'; // need to fill the field
        }
      } finally {
        store.setState({
          netatmoUsername: (netatmoUsername || {}).value,
          netatmoPassword,
          netatmoClientId: (netatmoClientId || {}).value,
          netatmoClientSecret,
          connected: false
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
        const result = await state.httpClient.post(`/api/v1/service/netatmo/connect`);
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
    displayConnectedMessage(state) {
      // display 3 seconds a message "NETATMO connected"
      store.setState({
        netatmoConnectedMessage: true,
        netatmoConnectedError: false,
        netatmoConnectionError: undefined
      });
      setTimeout(
        () =>
          store.setState({
            netatmoConnectedMessage: false,
            connectMqttStatus: undefined
          }),
        3000
      );
    },
    displayNetatmoError(state) {
      console.log('HERE')
      store.setState({
        netatmoConnectedMessage: false,
        netatmoConnectedError: true,
        connectNetatmoStatus: undefined
      });
    },
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
