import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateFreeMobileUsername(state, e) {
    store.setState({
      freeMobileUsername: e.target.value
    });
  },

  updateFreeMobileAccessToken(state, e) {
    store.setState({
      freeMobileAccessToken: e.target.value
    });
  },

  async getFreeMobileSettings(state) {
    store.setState({
      freeMobileGetSettingsStatus: RequestStatus.Getting
    });
    try {
      let username = '';
      let accessToken = '';
      try {
        const usernameResponse = await state.httpClient.get(
          '/api/v1/service/free-mobile/variable/FREE_MOBILE_USERNAME',
          {
            userRelated: true
          }
        );
        username = usernameResponse.value || '';
      } catch (e) {
        if (!e.response || e.response.status !== 404) {
          throw e;
        }
        // variable not set yet
      }
      try {
        const accessTokenResponse = await state.httpClient.get(
          '/api/v1/service/free-mobile/variable/FREE_MOBILE_ACCESS_TOKEN',
          {
            userRelated: true
          }
        );
        accessToken = accessTokenResponse.value || '';
      } catch (e) {
        if (!e.response || e.response.status !== 404) {
          throw e;
        }
        // variable not set yet
      }
      store.setState({
        freeMobileUsername: username,
        freeMobileAccessToken: accessToken,
        freeMobileGetSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        freeMobileGetSettingsStatus: RequestStatus.Error
      });
    }
  },

  async saveFreeMobileSettings(state, e) {
    e.preventDefault();
    store.setState({
      freeMobileSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      const username = (state.freeMobileUsername || '').trim();
      const accessToken = (state.freeMobileAccessToken || '').trim();
      store.setState({
        freeMobileUsername: username,
        freeMobileAccessToken: accessToken
      });
      await state.httpClient.post('/api/v1/service/free-mobile/variable/FREE_MOBILE_USERNAME', {
        value: username,
        userRelated: true
      });
      await state.httpClient.post('/api/v1/service/free-mobile/variable/FREE_MOBILE_ACCESS_TOKEN', {
        value: accessToken,
        userRelated: true
      });

      store.setState({
        freeMobileSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        freeMobileSaveSettingsStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
