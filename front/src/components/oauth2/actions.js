import { RequestStatus } from '../../utils/consts';
import { OAUTH2 } from '../../../../server/utils/constants';

const actions = store => ({
  updateIntegrationName(state, e) {
    store.setState({
      integrationName: e
    });
  },
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

    const returnServiceId = (await state.httpClient.get(`/api/v1/service/${state.integrationName}`)).id;

    const returnGetConfig = await state.httpClient.get('/api/v1/service/oauth2/client', {
      serviceId: returnServiceId
    });
    if (returnGetConfig) {
      store.setState({
        clientIdInDb: returnGetConfig.clientId,
        oauth2ErrorMsg: null,
        oauth2GetStatus: RequestStatus.Success
      });
    } else {
      store.setState({
        oauth2ErrorMsg: null,
        oauth2GetStatus: RequestStatus.Success
      });
    }
  },
  async startConnect(state) {
    store.setState({
      oauth2GetStatus: RequestStatus.Getting
    });
    try {
      if (!state.secret || !state.clientId) {
        store.setState({
          oauth2GetStatus: RequestStatus.Error,
          oauth2ErrorMsg: 'errorEmptyConfig'
        });
        return;
      }

      const serviceId = (await state.httpClient.get(`/api/v1/service/${state.integrationName}`)).id;

      // Save Oauth2 variables
      await state.httpClient.post(`/api/v1/service/${state.integrationName}/variable/${OAUTH2.VARIABLE.CLIENT_ID}`, {
        value: state.clientId,
        userRelated: true
      });

      await state.httpClient.post(
        `/api/v1/service/${state.integrationName}/variable/${OAUTH2.VARIABLE.CLIENT_SECRET}`,
        {
          value: state.secret,
          userRelated: true
        }
      );

      const returnValue = await state.httpClient.post('/api/v1/service/oauth2/client/authorization-uri', {
        clientId: state.clientId,
        secret: state.secret,
        integrationName: state.integrationName,
        serviceId
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

    await state.httpClient.get(`/api/v1/service/${state.integrationName}/deleteConfig`);

    store.setState({
      clientIdInDb: null,
      oauth2ErrorMsg: null,
      oauth2GetStatus: RequestStatus.Success
    });
  }
});

export default actions;
