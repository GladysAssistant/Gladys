import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let arduinoURL;
      let arduinoUsername;
      let arduinoPassword;
      try {
        arduinoURL = await state.httpClient.get('/api/v1/service/arduino/variable/ARDUINO_URL');
        arduinoUsername = await state.httpClient.get('/api/v1/service/arduino/variable/ARDUINO_USERNAME');
        if (arduinoUsername.value) {
          arduinoPassword = '*********'; // this is just used so that the field is filled
        }
      } finally {
        store.setState({
          arduinoURL: (arduinoURL || {}).value,
          arduinoUsername: (arduinoUsername || { value: '' }).value,
          arduinoPassword,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'arduinoPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectArduinoStatus: RequestStatus.Getting,
        arduinoConnected: false
      });
      try {
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_URL', {
          value: state.arduinoURL
        });
        await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_USERNAME', {
          value: state.arduinoUsername
        });
        if (state.passwordChanges) {
          await state.httpClient.post('/api/v1/service/arduino/variable/ARDUINO_PASSWORD', {
            value: state.arduinoPassword
          });
        }
        await state.httpClient.post(`/api/v1/service/arduino/connect`);

        store.setState({
          connectArduinoStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          connectArduinoStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayConnectedMessage(state) {
      // display 3 seconds a message "Arduino connected"
      store.setState({
        arduinoConnected: true
      });
      setTimeout(
        () =>
          store.ArduinosetState({
            arduinoConnected: false,
            connectArduinoStatus: undefined
          }),
        3000
      );
    },
    displayArduinoError(state, error) {
      store.setState({
        arduinoConnected: false,
        arduinoConnectionError: error
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
