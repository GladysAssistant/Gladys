import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      todoistApiKey: e.target.value
    });
  },
  async getApiKey(state) {
    store.setState({
      todoistGetApiKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/todoist/variable/TODOIST_API_KEY');
      store.setState({
        todoistApiKey: variable.value,
        todoistGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        todoistGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveApiKey(state, e) {
    e.preventDefault();
    store.setState({
      todoistSaveApiKeyStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        todoistApiKey: state.todoistApiKey.trim()
      });
      // save api key
      await state.httpClient.post('/api/v1/service/todoist/variable/TODOIST_API_KEY', {
        value: state.todoistApiKey.trim()
      });
      // start service
      await state.httpClient.post('/api/v1/service/todoist/start');
      store.setState({
        todoistSaveApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        todoistSaveApiKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
