import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      darkSkyApiKey: e.target.value
    });
  },
  async getApiKey(state) {
    store.setState({
      darkskyGetApiKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/darksky/variable/DARKSKY_API_KEY');
      store.setState({
        darkSkyApiKey: variable.value,
        darkskyGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        darkskyGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveApiKey(state) {
    store.setState({
      darkskySaveApiKeyStatus: RequestStatus.Getting
    });
    try {
      // save api key
      await state.httpClient.post('/api/v1/service/darksky/variable/DARKSKY_API_KEY', {
        value: state.darkSkyApiKey
      });
      // start service
      await state.httpClient.post('/api/v1/service/darksky/start');
      store.setState({
        darkskySaveApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        darkskySaveApiKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
