import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateMeteoFranceApiKey(state, e) {
    store.setState({ meteoFranceApiKey: e.target.value });
  },
  async getMeteoFranceApiKey(state) {
    store.setState({ meteoFranceGetApiKeyStatus: RequestStatus.Getting });
    try {
      const variable = await state.httpClient.get('/api/v1/service/meteofrance/variable/METEOFRANCE_API_KEY');
      store.setState({
        meteoFranceApiKey: variable.value,
        meteoFranceGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({ meteoFranceGetApiKeyStatus: RequestStatus.Error });
    }
  },
  async saveMeteoFranceApiKey(state, e) {
    e.preventDefault();
    store.setState({ meteoFranceSaveApiKeyStatus: RequestStatus.Getting });
    try {
      await state.httpClient.post('/api/v1/service/meteofrance/variable/METEOFRANCE_API_KEY', {
        value: (state.meteoFranceApiKey || '').trim()
      });
      await state.httpClient.post('/api/v1/service/meteofrance/start');
      store.setState({ meteoFranceSaveApiKeyStatus: RequestStatus.Success });
    } catch (e) {
      store.setState({ meteoFranceSaveApiKeyStatus: RequestStatus.Error });
    }
  }
});

export default actions;
