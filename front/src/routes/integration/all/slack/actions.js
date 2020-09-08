import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateSlackApiKey(state, e) {
    store.setState({
      slackApiKey: e.target.value
    });
  },
  async getSlackApiKey(state) {
    store.setState({
      slackGetApiKeyStatus: RequestStatus.Getting
    });
    try {
      const variable = await state.httpClient.get('/api/v1/service/slack/variable/SLACK_API_KEY');
      store.setState({
        slackApiKey: variable.value
      });
      const { link } = await state.httpClient.get('/api/v1/service/slack/link');
      store.setState({
        slackCustomLink: link,
        slackGetApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        slackGetApiKeyStatus: RequestStatus.Error
      });
    }
  },
  async saveSlackApiKey(state, e) {
    e.preventDefault();
    store.setState({
      slackSaveApiKeyStatus: RequestStatus.Getting
    });
    try {
      store.setState({
        slackApiKey: state.slackApiKey.trim()
      });
      // save telegram api key
      await state.httpClient.post('/api/v1/service/slack/variable/SLACK_API_KEY', {
        value: state.slackApiKey.trim()
      });
      // start service
      await state.httpClient.post('/api/v1/service/slack/start');
      // get custom link
      const { link } = await state.httpClient.get('/api/v1/service/slack/link');
      store.setState({
        slackCustomLink: link,
        slackSaveApiKeyStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        slackCustomLink: null,
        slackSaveApiKeyStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
