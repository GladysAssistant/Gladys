import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      darkSkyApiKey: e.target.value
    });
  },
  async getConfig(state) {
    store.setState({
      darkskyConfigStatus: RequestStatus.Getting
    });
    try {
      const apiKey = await state.httpClient.get('/api/v1/service/darksky/variable/DARKSKY_API_KEY');
      store.setState({
        darkSkyApiKey: apiKey.value,
        darkskyGetConfigStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        darkskyGetConfigStatus: RequestStatus.Error
      });
    }
  },
  async saveConfig(state) {
    store.setState({
      darkskySaveConfigStatus: RequestStatus.Getting
    });
    try {
      // save config
      await state.httpClient.post('/api/v1/service/darksky/variable/DARKSKY_API_KEY', {
        value: state.darkSkyApiKey.trim()
      });
      // start service
      await state.httpClient.post('/api/v1/service/darksky/start');
      store.setState({
        darkskySaveConfigStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        darkskySaveConfigStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
