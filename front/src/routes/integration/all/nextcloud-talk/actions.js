import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateNextcloudUrl(state, e) {
    store.setState({
      nextcloudUrl: e.target.value
    });
  },
  updateNextcloudBotUsername(state, e) {
    store.setState({
      nextcloudBotUsername: e.target.value
    });
  },
  updateNextcloudBotPassword(state, e) {
    store.setState({
      nextcloudBotPassword: e.target.value
    });
  },
  updateNextcloudTalkToken(state, e) {
    store.setState({
      nextcloudTalkToken: e.target.value
    });
  },
  async getNextcloudTalkSetting(state) {
    let nextcloudUrl = '';
    let nextcloudBotUsername = '';
    let nextcloudBotPassword = '';
    let nextcloudTalkToken = '';

    store.setState({
      nextcloudTalkGetSettingsStatus: RequestStatus.Getting,
      nextcloudUrl,
      nextcloudBotUsername,
      nextcloudBotPassword,
      nextcloudTalkToken
    });

    try {
      const { value: url } = await state.httpClient.get('/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_URL', {
        userRelated: true
      });
      nextcloudUrl = url;

      const { value: username } = await state.httpClient.get(
        '/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_BOT_USERNAME',
        {
          userRelated: true
        }
      );
      nextcloudBotUsername = username;

      const { value: password } = await state.httpClient.get(
        '/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_BOT_PASSWORD',
        {
          userRelated: true
        }
      );
      nextcloudBotPassword = password;

      const { value: token } = await state.httpClient.get(
        '/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_TALK_TOKEN',
        {
          userRelated: true
        }
      );
      nextcloudTalkToken = token;

      store.setState({
        nextcloudTalkGetSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        nextcloudTalkGetSettingsStatus: RequestStatus.Error
      });
    }

    store.setState({
      nextcloudUrl,
      nextcloudBotUsername,
      nextcloudBotPassword,
      nextcloudTalkToken
    });
  },
  async saveNextcloudTalkSettings(state) {
    store.setState({
      nextcloudTalkSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      // save Nextcloud url
      await state.httpClient.post('/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_URL', {
        value: state.nextcloudUrl,
        userRelated: true
      });
      // save Nextcloud Talk bot username
      await state.httpClient.post('/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_BOT_USERNAME', {
        value: state.nextcloudBotUsername,
        userRelated: true
      });
      // save Nextcloud Talk bot password
      await state.httpClient.post('/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_BOT_PASSWORD', {
        value: state.nextcloudBotPassword,
        userRelated: true
      });
      // save Nextcloud Talk token
      await state.httpClient.post('/api/v1/service/nextcloud-talk/variable/NEXTCLOUD_TALK_TOKEN', {
        value: state.nextcloudTalkToken,
        userRelated: true
      });
      // start service
      await state.httpClient.post('/api/v1/service/nextcloud-talk/start');

      store.setState({
        nextcloudTalkSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        nextcloudTalkSaveSettingsStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
