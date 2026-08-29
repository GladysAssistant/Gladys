import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      tmdbApiKey: e.target.value
    });
  },
  async getApiKey(state) {
    store.setState({
      tmdbGetApiKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/tmdb/variable/TMDB_API_KEY');
      store.setState({
        tmdbApiKey: variable.value,
        tmdbGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        tmdbGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveApiKey(state, e) {
    e.preventDefault();
    store.setState({
      tmdbSaveApiKeyStatus: RequestStatus.Getting,
      // A save attempt supersedes any stale error from the initial key load:
      // otherwise a failed getApiKey() followed by a successful save would
      // keep the error alert visible forever (tmdbGetApiKeyStatus is never
      // touched by saveApiKey otherwise, so it never clears on its own).
      tmdbGetApiKeyStatus: RequestStatus.Success
    });
    try {
      store.setState({
        tmdbApiKey: state.tmdbApiKey.trim()
      });
      await state.httpClient.post('/api/v1/service/tmdb/variable/TMDB_API_KEY', {
        value: state.tmdbApiKey.trim()
      });
      await state.httpClient.post('/api/v1/service/tmdb/start');
      store.setState({
        tmdbSaveApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        tmdbSaveApiKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
