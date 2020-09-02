import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      openWeatherApiKey: e.target.value
    });
  },
  async getApiKey(state) {
    store.setState({
      openWeatherGetApiKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/openweather/variable/OPENWEATHER_API_KEY');
      store.setState({
        openWeatherApiKey: variable.value,
        openWeatherGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        openWeatherGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveApiKey(state, e) {
    e.preventDefault();
    store.setState({
      openWeatherSaveApiKeyStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        openWeatheryApiKey: state.openWeatherApiKey.trim()
      });
      // save api key
      await state.httpClient.post('/api/v1/service/openweather/variable/OPENWEATHER_API_KEY', {
        value: state.openWeatherApiKey.trim()
      });
      // start service
      await state.httpClient.post('/api/v1/service/openweather/start');
      store.setState({
        openWeatherSaveApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        openWeatherSaveApiKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
