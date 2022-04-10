import { RequestStatus } from '../../utils/consts';
import { OAUTH2 } from '../../../../server/utils/constants';

const actions = store => ({
  updateClientId(state, e) {
    store.setState({
      clientId: e.target.value
    });
  },
  updateSecret(state, e) {
    store.setState({
      secret: e.target.value
    });
  },
  async getCurrentConfig(state) {
    store.setState({
      oauth2GetStatus: RequestStatus.Getting
    });
    try {
      const returnGetConfig = await state.httpClient.get('/api/v1/service/oauth2/client', {
        service_id: state.currentIntegration.id
      });

      if (returnGetConfig.client_id) {
        store.setState({
          clientIdInDb: returnGetConfig.client_id,
          oauth2ErrorMsg: null,
          oauth2GetStatus: RequestStatus.Success
        });
      } else {
        store.setState({
          oauth2ErrorMsg: null,
          oauth2GetStatus: RequestStatus.Success
        });
      }
    } catch (e) {
      store.setState({
        oauth2GetStatus: RequestStatus.Error
      });
    }
  },
  async startConnect(state) {
    if (!state.secret || !state.clientId) {
      store.setState({
        oauth2GetStatus: RequestStatus.Error,
        oauth2ErrorMsg: 'errorEmptyConfig'
      });
      return;
    }
    try {
      store.setState({
        oauth2GetStatus: RequestStatus.Getting
      });

      // Save Oauth2 variables
      await state.httpClient.post(
        `/api/v1/service/${state.currentIntegration.name}/variable/${OAUTH2.VARIABLE.CLIENT_ID}`,
        {
          value: state.clientId,
          userRelated: true
        }
      );

      await state.httpClient.post(
        `/api/v1/service/${state.currentIntegration.name}/variable/${OAUTH2.VARIABLE.CLIENT_SECRET}`,
        {
          value: state.secret,
          userRelated: true
        }
      );

      const returnValue = await state.httpClient.post('/api/v1/service/oauth2/client/authorization-uri', {
        integration_name: state.currentIntegration.name,
        service_id: state.currentIntegration.id
      });

      if (returnValue.authorizationUri) {
        window.location = returnValue.authorizationUri;
      } else {
        store.setState({
          oauth2GetStatus: RequestStatus.Error,
          oauth2ErrorMsg: 'errorAuthorizationUri'
        });
        return;
      }
    } catch (e) {
      store.setState({
        oauth2GetStatus: RequestStatus.Error,
        oauth2ErrorMsg: 'errorAuthorizationUri'
      });
      return;
    }
  },
  async unConnect(state) {
    store.setState({
      oauth2GetStatus: RequestStatus.Getting
    });

    await state.httpClient.get(`/api/v1/service/${state.currentIntegration.name}/reset`);

    store.setState({
      clientIdInDb: null,
      oauth2ErrorMsg: null,
      oauth2GetStatus: RequestStatus.Success
    });
  }
});

export default actions;
