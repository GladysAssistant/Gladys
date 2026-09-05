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
      // The bot API key is a service-wide secret: the server answers 403 to a
      // non-admin, and only an admin is shown the form to change it. Its own
      // failure must not abort the load: every user comes to this page for
      // their linking link, which is per-user.
      // The role is deliberately not read from the store here. On a hard page
      // load this action runs during the first render, before checkSession()
      // has filled in the user, so an admin would be treated as a non-admin
      // and never see the key.
      try {
        const variable = await state.httpClient.get('/api/v1/service/telegram/variable/TELEGRAM_API_KEY');
        store.setState({
          telegramApiKey: variable.value
        });
      } catch (e) {
        // only the expected answers are swallowed: 403 for a non-admin, 404 when
        // no key is set yet. Anything else (a 500, a network failure) is a real
        // error and must not leave an admin in front of a silently empty field.
        const status = e && e.response && e.response.status;
        if (status !== 403 && status !== 404) {
          throw e;
        }
        store.setState({
          telegramApiKey: ''
        });
      }
      const { link } = await state.httpClient.get('/api/v1/service/telegram/link');
      store.setState({
        telegramCustomLink: link,
        telegramGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        telegramGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveTelegramApiKey(state, e) {
    e.preventDefault();
    store.setState({
      telegramSaveApiKeyStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        telegramApiKey: state.telegramApiKey.trim()
      });
      // save telegram api key
      await state.httpClient.post('/api/v1/service/telegram/variable/TELEGRAM_API_KEY', {
        value: state.telegramApiKey.trim()
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
        telegramCustomLink: null,
        telegramSaveApiKeyStatus: RequestStatus.Error
      });
    }
  },
  showTelegramDisableConfirmation() {
    store.setState({
      telegramDisableConfirmation: true,
      telegramDisableStatus: undefined
    });
  },
  hideTelegramDisableConfirmation() {
    store.setState({
      telegramDisableConfirmation: false
    });
  },
  async disableTelegram(state) {
    store.setState({
      telegramDisableStatus: RequestStatus.Getting
    });
    try {
      await state.httpClient.post('/api/v1/service/telegram/disable');
      store.setState({
        telegramApiKey: '',
        telegramCustomLink: null,
        telegramDisableConfirmation: false,
        telegramSaveApiKeyStatus: undefined,
        telegramDisableStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        telegramDisableStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
