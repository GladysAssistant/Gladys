import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updatePushoverApiKey(state, e) {
    store.setState({
      pushoverApiKey: e.target.value
    });
  },
  updatePushoverUserKey(state, e) {
    store.setState({
      pushoverUserKey: e.target.value
    });
  },
  async getPushoverKeys(state) {
    store.setState({
      pushoverGetApiKeyStatus: RequestStatus.Getting,
	  pushoverGetUserKeyStatus: RequestStatus.Getting
    });
    try {
	  const variable1 = await state.httpClient.get('/api/v1/service/pushover/variable/PUSHOVER_API_KEY');
      const variable2 = await state.httpClient.get('/api/v1/service/pushover/variable/PUSHOVER_USER_KEY');
      store.setState({
        pushoverApiKey: variable1.value,
		pushoverUserKey: variable2.value
      });
      store.setState({
        pushoverGetApiKeyStatus: RequestStatus.Success,
		pushoverGetUserKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        pushoverGetApiKeyStatus: RequestStatus.Error,
		pushoverGetUserKeyStatus: RequestStatus.Error
      });
    }
  },
  async savePushover(state, e) {
    e.preventDefault();
    store.setState({
      pushoverSaveApiKeyStatus: RequestStatus.Getting,
	  pushoverSaveUserKeyStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        pushoverApiKey: state.pushoverApiKey.trim(),
		pushoverUserKey: state.pushoverUserKey.trim()
      });
      // save pushover api key
      await state.httpClient.post('/api/v1/service/pushover/variable/PUSHOVER_API_KEY', {
        value: state.pushoverApiKey.trim()
      });
	  await state.httpClient.post('/api/v1/service/pushover/variable/PUSHOVER_USER_KEY', {
        value: state.pushoverUserKey.trim()
      });
      // start service
      await state.httpClient.post('/api/v1/service/pushover/start');
      store.setState({
        pushoverSaveApiKeyStatus: RequestStatus.Success,
		pushoverSaveUserKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        pushoverSaveApiKeyStatus: RequestStatus.Error,
		pushoverSaveUserKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
