import { RequestStatus } from '../../../../utils/consts';

const actions = store => ({
  updateCaldavHost(state, e) {
    store.setState({
      caldavHost: e.target.value
    });

    if (e.target.value === 'apple') {
      store.setState({
        caldavUrl: 'icloud.com'
      });
    }
  },
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

    let caldavHost = 'other';
    let caldavUrl = '';
    let caldavUsername = '';
    let caldavPassword = '';

    store.setState({
      caldavHost,
      caldavUrl,
      caldavUsername,
      caldavPassword,
    });

    try {
      const { value: host } = await state.httpClient.get('/api/v1/service/caldav/variable/CALDAV_HOST', {
        userRelated: true
      });
      caldavHost = host;

      const { value: url } = await state.httpClient.get('/api/v1/service/caldav/variable/CALDAV_URL', {
        userRelated: true
      });
      caldavUrl = url;

      const { value: username } = await state.httpClient.get('/api/v1/service/caldav/variable/CALDAV_USERNAME', {
        userRelated: true
      });
      caldavUsername = username;

      const { value: password } = await state.httpClient.get('/api/v1/service/caldav/variable/CALDAV_PASSWORD', {
        userRelated: true
      });
      caldavPassword = password;

      store.setState({
        caldavGetSettingsStatus: RequestStatus.Success
      })
    } catch (e) {
      store.setState({
        caldavGetSettingsStatus: RequestStatus.Error
      });
    }

    store.setState({
      caldavHost,
      caldavUrl,
      caldavUsername,
      caldavPassword,
    });
  },
  async saveCaldavSettings(state) {
    store.setState({
      caldavSettingsStatus: RequestStatus.Getting
    });
    try {
      // save caldav host
      await state.httpClient.post('/api/v1/service/caldav/variable/CALDAV_HOST', {
        value: state.caldavHost,
        userRelated: true
      });
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

      const { url = state.caldavUrl } = await state.httpClient.get('/api/v1/service/caldav/config');
      store.setState({
        caldavUrl: url,
        caldavSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavSettingsStatus: RequestStatus.Error
      });
    }
  },
  async startSync(state) {
    store.setState({
      caldavSettingsStatus: RequestStatus.Getting
    });
    try {
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
