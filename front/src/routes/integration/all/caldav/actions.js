import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateCaldavUrl(state, e) {
    store.setState({
      caldavUrl: e.target.value
    });
  },
  updateCaldavUsername(state, e) {
    store.setState({
      caldavUsername: e.target.value
    });
  },
  updateCaldavPassword(state, e) {
    store.setState({
      caldavPassword: e.target.value
    });
  },
  async getCaldavSetting(state) {
    store.setState({
      caldavGetSettingsStatus: RequestStatus.Getting
    });
    try {
      const { value: caldavUrl } = await state.httpClient.get('/api/v1/service/caldav/variable/CALDAV_URL', {
        userRelated: true
      });
      const { value: caldavUsername } = await state.httpClient.get('/api/v1/service/caldav/variable/CALDAV_USERNAME', {
        userRelated: true
      });
      const { value: caldavPassword } = await state.httpClient.get('/api/v1/service/caldav/variable/CALDAV_PASSWORD', {
        userRelated: true
      });

      store.setState({
        caldavUrl,
        caldavUsername,
        caldavPassword,
        caldavGetSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavGetSettingsStatus: RequestStatus.Error
      });
    }
  },
  async saveCaldavSettings(state) {
    store.setState({
      caldavSettingsStatus: RequestStatus.Getting
    });
    try {
      // save caldav url
      await state.httpClient.post('/api/v1/service/caldav/variable/CALDAV_URL', {
        value: state.caldavUrl,
        userRelated: true
      });
      // save caldav username
      await state.httpClient.post('/api/v1/service/caldav/variable/CALDAV_USERNAME', {
        value: state.caldavUsername,
        userRelated: true
      });
      // save caldav password
      await state.httpClient.post('/api/v1/service/caldav/variable/CALDAV_PASSWORD', {
        value: state.caldavPassword,
        userRelated: true
      });
      // start service
      await state.httpClient.post('/api/v1/service/caldav/start');

      await state.httpClient.get('/api/v1/service/caldav/sync');
      store.setState({
        caldavSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavSettingsStatus: RequestStatus.Error
      });
    }
  }
});

export default actions;
