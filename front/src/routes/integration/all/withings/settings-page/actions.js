import { route } from 'preact-router';
import { RequestStatus } from '../../../../../utils/consts';

const actions = store => ({
  async initWithingsDevices(state) {
    store.setState({
      oauth2GetStatus: RequestStatus.Getting,
      withingsGetStatus: RequestStatus.Getting
    });
    try {
      // check if this call is a return of oauth2 authorize code
      if (state.currentUrl) {
        if (this.code) {
          await state.httpClient.post('/api/v1/service/oauth2/client/access-token', {
            integrationName: 'withings',
            authorization_code: this.code,
            service_id: state.currentIntegration.id
          });

          route('/dashboard/integration/health/withings/settings');
        }

        const returnGetConfig = await state.httpClient.get('/api/v1/service/oauth2/client', {
          service_id: state.currentIntegration.id
        });
        // Case of config found
        let withingsDevices;
        if (returnGetConfig.client_id) {
          const result = await state.httpClient.post('/api/v1/service/withings/init');
          if (result) {
            withingsDevices = result.withingsDevices;
          }

          store.setState({
            oauth2GetStatus: RequestStatus.Success,
            withingsGetStatus: RequestStatus.Success,
            withingsDevices
          });
        }
      }
    } catch (e) {
      store.setState({
        oauth2GetStatus: RequestStatus.Error,
        oauth2ErrorMsg: 'errorAuthorizationUri'
      });
    }
  }
});

export default actions;
