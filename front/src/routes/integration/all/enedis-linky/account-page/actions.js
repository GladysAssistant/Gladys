import { RequestStatus } from '../../../../../utils/consts';

const actions = store => ({
  updateEnedisAccessToken(state, e) {
    store.setState({
      enedisAccessToken: e.target.value
    });
  },
  updateEnedisRefreshToken(state, e) {
    store.setState({
      enedisRefreshToken: e.target.value
    });
  },
  async getEnedisSetting(state) {
    store.setState({
      enedisGetSettingsStatus: RequestStatus.Getting
    });

    let enedisAccessToken = '';
    let enedisRefreshToken = '';

    store.setState({
      enedisAccessToken,
      enedisRefreshToken
    });

    try {
      const { value: accessToken } = await state.httpClient.get(
        '/api/v1/service/enedis-linky/variable/ENEDIS_ACCESS_TOKEN'
      );
      enedisAccessToken = accessToken;

      const { value: refreshToken } = await state.httpClient.get(
        '/api/v1/service/enedis-linky/variable/ENEDIS_REFRESH_TOKEN'
      );
      enedisRefreshToken = refreshToken;

      store.setState({
        enedisGetSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        enedisGetSettingsStatus: RequestStatus.Error
      });
    }

    store.setState({
      enedisAccessToken,
      enedisRefreshToken
    });
  },
  async saveEnedisSettings(state) {
    store.setState({
      enedisSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      // save Enedis Access Token
      await state.httpClient.post('/api/v1/service/enedis-linky/variable/ENEDIS_ACCESS_TOKEN', {
        value: state.enedisAccessToken
      });
      // save Enedis Refresh Token
      await state.httpClient.post('/api/v1/service/enedis-linky/variable/ENEDIS_REFRESH_TOKEN', {
        value: state.enedisRefreshToken
      });

      store.setState({
        enedisSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        enedisSaveSettingsStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
