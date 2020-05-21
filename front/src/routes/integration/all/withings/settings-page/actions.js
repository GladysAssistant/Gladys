import queryString from 'query-string';
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
          const returnServiceId = await state.httpClient.get('/api/v1/service/withings/getServiceId');
          const serviceId = returnServiceId.result.serviceId;
          const returnValue = await state.httpClient.post('/api/v1/service/oauth2/buildTokenAccessUri', {
            integrationName: 'withings',
            authorizationCode: queryParams.code,
            serviceId,
          });

          await state.httpClient.post('/api/v1/service/withings/init', {
            accessTokenResponse: returnValue.result
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
