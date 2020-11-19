import { RequestStatus } from '../../../../../utils/consts';

const actions = store => ({
  updateApiKey(state, e) {
    store.setState({
      merossKey: e.target.value
    });
  },
  async getApiKey(state) {
    store.setState({
      merossGetKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/meross/variable/MEROSS_KEY');
      store.setState({
        merossKey: variable.value,
        merossGetKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        merossGetKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveApiKey(state, e) {
    e.preventDefault();
    store.setState({
      merossSaveKeyStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        merossKey: state.merossKey.trim()
      });
      // save key
      await state.httpClient.post('/api/v1/service/meross/variable/MEROSS_KEY', {
        value: state.merossKey.trim()
      });
      // start service
      await state.httpClient.post('/api/v1/service/meross/start');
      store.setState({
        merossSaveKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        merossSaveKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
