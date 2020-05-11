import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const actions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let heatzyLogin;
      let heatzyPassword;
      try {
        heatzyLogin = await state.httpClient.get('/api/v1/service/heatzy/variable/HEATZY_LOGIN');
        if (heatzyLogin.value) {
          heatzyPassword = '*********'; // this is just used so that the field is filled
        }
      } finally {
        store.setState({
          heatzyLogin: (heatzyLogin || { value: '' }).value,
          heatzyPassword,
          passwordChanges: false,
          connected: false
        });
      }
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      if (e.target.name === 'heatzyPassword') {
        data.passwordChanges = true;
      }
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        connectHeatzyStatus: RequestStatus.Getting,
        heatzyConnected: false,
        heatzyConnectionError: undefined
      });
      try {
        await state.httpClient.post('/api/v1/service/heatzy/variable/HEATZY_LOGIN', {
          value: state.heatzyLogin
        });
        if (state.passwordChanges) {
          await state.httpClient.post('/api/v1/service/heatzy/variable/HEATZY_PASSWORD', {
            value: state.heatzyPassword
          });
        }

        await state.httpClient.post(`/api/v1/service/heatzy/connect`);

        store.setState({
          connectHeatzyStatus: RequestStatus.Success
        });

        setTimeout(() => store.setState({ connectHeatzyStatus: undefined }), 3000);
      } catch (e) {
        store.setState({
          connectHeatzyStatus: RequestStatus.Error,
          passwordChanges: false
        });
      }
    },
    displayHeatzyConnectedMessage(state) {
      // display 3 seconds a message "Heatzy connected"
      store.setState({
        heatzyConnected: true,
        heatzyConnectionError: undefined
      });

      setTimeout(
        () =>
          store.setState({
            heatzyConnected: false,
            connectHeatzyStatus: undefined
          }),
        3000
      );
    },
    displayHeatzyError(state, error) {
      store.setState({
        heatzyConnected: false,
        connectHeatzyStatus: undefined,
        heatzyConnectionError: error
      });
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default actions;
