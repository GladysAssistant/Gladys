import createActionsIntegration from '../../../../../actions/integration';
import { RequestStatus } from '../../../../../utils/consts';

const createActions = store => {
  const integrationActions = createActionsIntegration(store);
  const actions = {
    async loadProps(state) {
      let smartthingsClientId;
      let smartthingsClientSecret;
      let smartthingsClient;
      let addDetailsSmartthingsStatus = RequestStatus.Error;
      store.setState({
        addDetailsSmartthingsStatus: RequestStatus.Getting
      });

      try {
        smartthingsClientId = await state.httpClient.get('/api/v1/service/smartthings/variable/SMARTTHINGS_PUBLIC_KEY');
        smartthingsClientSecret = await state.httpClient.get(
          '/api/v1/service/smartthings/variable/SMARTTHINGS_SECRET_KEY'
        );
        smartthingsClient = await state.httpClient.get('/api/v1/oauth/client/smartthings');
        addDetailsSmartthingsStatus = RequestStatus.Success;
        store.setState({
          smartthingsClientId: smartthingsClientId.value,
          smartthingsClientSecret: smartthingsClientSecret.value
        });
      } finally {
        store.setState({
          smartthingsClientId: (smartthingsClientId || {}).value,
          smartthingsClientSecret: (smartthingsClientSecret || {}).value,
          addDetailsSmartthingsStatus,
          smartthingsGladysClientId: (smartthingsClient || {}).id,
          smartthingsGladysClientSecret: (smartthingsClient || {}).secret
        });
      }
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
        await state.httpClient.post('/api/v1/service/smartthings/variable/SMARTTHINGS_PUBLIC_SECRET', {
          value: state.smartthingsClientSecret
        });

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
