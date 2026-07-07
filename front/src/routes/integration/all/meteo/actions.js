import { RequestStatus } from '../../../../utils/consts';

const METEO_SOURCE_DEFAULT = 'meteofrance';

const actions = store => ({
  updateMeteoSource(state, e) {
    store.setState({ meteoSource: e.target.value });
  },
  updateMeteoFranceApiKey(state, e) {
    store.setState({ meteoFranceApiKey: e.target.value });
  },
  updateMeteoOpenWeatherApiKey(state, e) {
    store.setState({ meteoOpenWeatherApiKey: e.target.value });
  },
  async getMeteoSettings(state) {
    store.setState({ meteoGetSettingsStatus: RequestStatus.Getting });
    // Each variable is fetched separately: a missing variable is a normal case, not an error
    let meteoSource = METEO_SOURCE_DEFAULT;
    let meteoFranceApiKey = '';
    let meteoOpenWeatherApiKey = '';
    try {
      const variable = await state.httpClient.get('/api/v1/service/meteo/variable/METEO_SOURCE');
      if (variable.value) {
        meteoSource = variable.value;
      }
    } catch (e) {}
    try {
      const variable = await state.httpClient.get('/api/v1/service/meteo/variable/METEOFRANCE_API_KEY');
      meteoFranceApiKey = variable.value || '';
    } catch (e) {}
    try {
      const variable = await state.httpClient.get('/api/v1/service/meteo/variable/OPENWEATHER_API_KEY');
      meteoOpenWeatherApiKey = variable.value || '';
    } catch (e) {}
    store.setState({
      meteoSource,
      meteoFranceApiKey,
      meteoOpenWeatherApiKey,
      meteoGetSettingsStatus: RequestStatus.Success
    });
  },
  async saveMeteoSettings(state, e) {
    e.preventDefault();
    store.setState({ meteoSaveSettingsStatus: RequestStatus.Getting });
    try {
      const meteoSource = state.meteoSource || METEO_SOURCE_DEFAULT;
      await state.httpClient.post('/api/v1/service/meteo/variable/METEO_SOURCE', {
        value: meteoSource
      });
      // Only save the API key of the selected source, to avoid overwriting the other one
      if (meteoSource === 'openweather') {
        await state.httpClient.post('/api/v1/service/meteo/variable/OPENWEATHER_API_KEY', {
          value: (state.meteoOpenWeatherApiKey || '').trim()
        });
      } else {
        await state.httpClient.post('/api/v1/service/meteo/variable/METEOFRANCE_API_KEY', {
          value: (state.meteoFranceApiKey || '').trim()
        });
      }
      await state.httpClient.post('/api/v1/service/meteo/start');
      store.setState({ meteoSaveSettingsStatus: RequestStatus.Success });
    } catch (e) {
      store.setState({ meteoSaveSettingsStatus: RequestStatus.Error });
    }
  }
});

export default actions;
