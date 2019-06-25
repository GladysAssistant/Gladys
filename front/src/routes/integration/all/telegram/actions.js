import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateTelegramApiKey(state, e) {
    store.setState({
      telegramApiKey: e.target.value
    });
  },
  async getTelegramApiKey(state) {
    store.setState({
      telegramGetApiKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/telegram/variable/TELEGRAM_API_KEY');
      const { link } = await state.httpClient.get('/api/v1/service/telegram/link');
      store.setState({
        telegramApiKey: variable.value,
        telegramCustomLink: link,
        telegramGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        telegramGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveTelegramApiKey(state) {
    store.setState({
      telegramSaveApiKeyStatus: RequestStatus.Getting
    });
    try {
      // save telegram api key
      await state.httpClient.post('/api/v1/service/telegram/variable/TELEGRAM_API_KEY', {
        value: state.telegramApiKey
      });
      // start service
      await state.httpClient.post('/api/v1/service/telegram/start');
      // get custom link
      const { link } = await state.httpClient.get('/api/v1/service/telegram/link');
      store.setState({
        telegramCustomLink: link,
        telegramSaveApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        telegramSaveApiKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
