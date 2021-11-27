import { NextcloudTalkStatus } from '../../../../utils/consts';

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
  updateNextcloudBotToken(state, e) {
    store.setState({
      nextcloudBotToken: e.target.value
    });
  },
  async getNextcloudTalkSetting(state) {
    store.setState({
      nextcloudTalkGetSettingsStatus: NextcloudTalkStatus.Getting
    });

    let nextcloudUrl = '';
    let nextcloudBotUsername = '';
    let nextcloudBotPassword = '';
    let nextcloudBotToken = '';

    store.setState({
      nextcloudUrl,
      nextcloudBotUsername,
      nextcloudBotPassword,
      nextcloudBotToken
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

      const { nextcloud_talk_token: token } = await state.httpClient.get('/api/v1/me');
      nextcloudBotToken = token;

      store.setState({
        nextcloudTalkGetSettingsStatus: NextcloudTalkStatus.Success
      });
    } catch (e) {
      store.setState({
        nextcloudTalkGetSettingsStatus: NextcloudTalkStatus.Error
      });
    }

    store.setState({
      nextcloudUrl,
      nextcloudBotUsername,
      nextcloudBotPassword,
      nextcloudBotToken
    });
  },
  async saveNextcloudTalkSettings(state) {
    store.setState({
      nextcloudTalkSaveSettingsStatus: NextcloudTalkStatus.Getting
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
      await state.httpClient.patch('/api/v1/me', { nextcloud_talk_token: state.nextcloudBotToken });
      // start service
      await state.httpClient.post('/api/v1/service/nextcloud-talk/start');

      store.setState({
        nextcloudTalkSaveSettingsStatus: NextcloudTalkStatus.Success
      });
    } catch (e) {
      store.setState({
        nextcloudTalkSaveSettingsStatus: NextcloudTalkStatus.Error
      });
    }
  }
});

export default actions;
