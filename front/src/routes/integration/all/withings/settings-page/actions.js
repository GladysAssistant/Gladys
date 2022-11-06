import { route } from 'preact-router';
import { RequestStatus } from '../../../../../utils/consts';

export const REDIRECT_URI_SUFFIX = 'dashboard/integration/health/withings/settings';

const actions = store => ({
  async initWithingsDevices(state, dictionary) {
    store.setState({
      oauth2GetStatus: RequestStatus.Getting,
      withingsGetStatus: RequestStatus.Getting
    });
    try {
      // check if this call is a return of oauth2 authorize code
      if (state.currentUrl) {
        if (this.code) {
          await state.httpClient.post('/api/v1/service/withings/oauth2/client/access-token', {
            integrationName: 'withings',
            authorization_code: this.code,
            service_id: state.currentIntegration.id,
            redirect_uri_suffix: REDIRECT_URI_SUFFIX
          });

          route(REDIRECT_URI_SUFFIX);
        }

        const returnGetConfig = await state.httpClient.get('/api/v1/service/withings/oauth2/client', {
          service_id: state.currentIntegration.id
        });

        // Case of config found
        let withingsDevices;
        if (returnGetConfig.client_id) {
          const result = await state.httpClient.post('/api/v1/service/withings/init_devices');
          console.log(result);
          if (result) {
            withingsDevices = result.withingsDevices;
            console.log('withingsDevices: ', withingsDevices);
            withingsDevices.forEach(device => {
              console.log('Device: ', device.name);
              device.features.forEach(feature => {
                const featureName = dictionary.deviceFeatureCategory[feature.category][feature.type];
                console.log('Feature: ', feature, featureName);
                if (featureName) {
                  feature.name = featureName;
                }
              });
            });
          }
        }

        store.setState({
          withingsGetStatus: RequestStatus.Success,
          withingsDevices
        });
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
