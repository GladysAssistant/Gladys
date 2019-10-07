import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let smartthingsClientId;
      let smartthingsClientSecret;
      let smartthingsClient;
      store.setState({
        loadSmartthingsStatus: RequestStatus.Getting,
        addDetailsSmartthingsStatus: RequestStatus.Getting
      });

      let newState = {};
      try {
        smartthingsClientId = await state.httpClient.get('/api/v1/service/smartthings/variable/SMARTTHINGS_PUBLIC_KEY');
        smartthingsClientSecret = await state.httpClient.get(
          '/api/v1/service/smartthings/variable/SMARTTHINGS_SECRET_KEY'
        );

        newState = {
          smartthingsClientId: smartthingsClientId.value,
          smartthingsClientSecret: smartthingsClientSecret.value,
          loadSmartthingsStatus: RequestStatus.Success
        };
      } catch (e) {
        newState = {
          loadSmartthingsStatus: RequestStatus.Success
        };
      }

      try {
        smartthingsClient = await state.httpClient.get('/api/v1/oauth/client/smartthings');
        newState = {
          ...newState,
          smartthingsGladysClientId: smartthingsClient.id,
          smartthingsGladysClientSecret: smartthingsClient.secret,
          addDetailsSmartthingsStatus: RequestStatus.Success
        };
      } catch (e) {
        newState = { ...newState, addDetailsSmartthingsStatus: RequestStatus.Success };
      }

      store.setState(newState);
    },
    updateConfigration(state, e) {
      const data = {};
      data[e.target.name] = e.target.value;
      store.setState(data);
    },
    async saveConfiguration(state) {
      event.preventDefault();
      store.setState({
        configureSmartthingsStatus: RequestStatus.Getting
      });
      try {
        await state.httpClient.post('/api/v1/service/smartthings/variable/SMARTTHINGS_PUBLIC_KEY', {
          value: state.smartthingsClientId
        });
        await state.httpClient.post('/api/v1/service/smartthings/variable/SMARTTHINGS_SECRET_KEY', {
          value: state.smartthingsClientSecret
        });
        await state.httpClient.post('/api/v1/service/smartthings/init');

        store.setState({
          configureSmartthingsStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          configureSmartthingsStatus: RequestStatus.Error
        });
      }
    }
  };
  return Object.assign({}, actions, integrationActions);
};

export default createActions;
