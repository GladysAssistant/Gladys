import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      tmdbApiKey: e.target.value
    });
  },
  async getApiKey(state) {
    store.setState({
      cinemaGetApiKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/cinema/variable/TMDB_API_KEY');
      store.setState({
        tmdbApiKey: variable.value,
        cinemaGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        cinemaGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveApiKey(state, e) {
    e.preventDefault();
    store.setState({
      cinemaSaveApiKeyStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        tmdbApiKey: state.tmdbApiKey.trim()
      });
      await state.httpClient.post('/api/v1/service/cinema/variable/TMDB_API_KEY', {
        value: state.tmdbApiKey.trim()
      });
      await state.httpClient.post('/api/v1/service/cinema/start');
      store.setState({
        cinemaSaveApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        cinemaSaveApiKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
