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
      const username = await state.httpClient.get('/api/v1/service/free-mobile/variable/FREE_MOBILE_USERNAME');
      store.setState({
        freeMobileUsername: username.value
      });

      const accessToken = await state.httpClient.get('/api/v1/service/free-mobile/variable/FREE_MOBILE_ACCESS_TOKEN');
      store.setState({
        freeMobileAccessToken: accessToken.value,
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
      store.setState({
        freeMobileUsername: state.freeMobileUsername.trim(),
        freeMobileAccessToken: state.freeMobileAccessToken.trim()
      });
      await state.httpClient.post('/api/v1/service/free-mobile/variable/FREE_MOBILE_USERNAME', {
        value: state.freeMobileUsername.trim()
      });
      await state.httpClient.post('/api/v1/service/free-mobile/variable/FREE_MOBILE_ACCESS_TOKEN', {
        value: state.freeMobileAccessToken.trim()
      });

      // start service
      await state.httpClient.post('/api/v1/service/free-mobile/start');
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
