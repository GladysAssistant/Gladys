import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      darkSkyApiKey: e.target.value
    });
  },
  updateDisplayMode(state, e) {
    store.setState({
      darkSkyDisplayMode: e.target.value
    });
  },
  async getConfig(state) {
    store.setState({
      darkskyConfigStatus: RequestStatus.Getting
    });
    try {
      const apiKey = await state.httpClient.get('/api/v1/service/darksky/variable/DARKSKY_API_KEY');
      const displayMode = await state.httpClient.get('/api/v1/service/darksky/variable/DARKSKY_DISPLAY_MODE');
      store.setState({
        darkSkyApiKey: apiKey.value,
        darkSkyDisplayMode: displayMode.value,
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
      await state.httpClient.post('/api/v1/service/darksky/variable/DARKSKY_DISPLAY_MODE', {
        value: state.darkSkyDisplayMode
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
