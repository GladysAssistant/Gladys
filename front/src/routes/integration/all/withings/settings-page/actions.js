import queryString from 'query-string';
import { route } from 'preact-router';
import { RequestStatus } from '../../../../../utils/consts';

const actions = store => ({
  async initWithingsDevices(state) {
    store.setState({
      oauth2GetStatus: RequestStatus.Getting
    });
    try {
      // check if this call is a return of oauth2 authorize code
      if (state.currentUrl) {
        const queryParams = queryString.parse(state.currentUrl.substring(state.currentUrl.indexOf('?')));
        if (queryParams && queryParams.code) {
          const serviceId = (await state.httpClient.get(`/api/v1/service/withings`)).id;

          await state.httpClient.post('/api/v1/service/oauth2/client/access-token-uri', {
            integrationName: 'withings',
            authorizationCode: queryParams.code,
            serviceId
          });

          await state.httpClient.post('/api/v1/service/withings/init');

          route('/dashboard/integration/health/withings/settings');
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
