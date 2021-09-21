import { CalDAVStatus } from '../../../../../utils/consts';
import get from 'get-value';

const actions = store => ({
  updateCaldavHost(state, e) {
    store.setState({
      caldavHost: e.target.value
    });

    if (e.target.value === 'apple') {
      store.setState({
        caldavUrl: 'https://caldav.icloud.com'
      });
    } else if (e.target.value === 'google') {
      store.setState({
        caldavUrl: 'https://www.google.com/calendar/dav'
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
      caldavGetSettingsStatus: CalDAVStatus.Getting
    });

    let caldavHost = 'other';
    let caldavUrl = '';
    let caldavUsername = '';
    let caldavPassword = '';

    store.setState({
      caldavHost,
      caldavUrl,
      caldavUsername,
      caldavPassword
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
        caldavGetSettingsStatus: CalDAVStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavGetSettingsStatus: CalDAVStatus.Error
      });
    }

    store.setState({
      caldavHost,
      caldavUrl,
      caldavUsername,
      caldavPassword
    });
  },
  async saveCaldavSettings(state) {
    store.setState({
      caldavSaveSettingsStatus: CalDAVStatus.Getting,
      caldavCleanUpStatus: null,
      caldavSyncStatus: null
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

      await state.httpClient.get('/api/v1/service/caldav/config');
      store.setState({
        caldavSaveSettingsStatus: CalDAVStatus.Success
      });
    } catch (e) {
      const responseMessage = get(e, 'response.data.message');
      if (responseMessage === 'CALDAV_BAD_USERNAME_PASSWORD') {
        store.setState({
          caldavSaveSettingsStatus: CalDAVStatus.BadCredentialsError
        });
      } else if (responseMessage === 'CALDAV_BAD_URL') {
        store.setState({
          caldavSaveSettingsStatus: CalDAVStatus.BadUrlError
        });
      } else if (responseMessage === 'CALDAV_BAD_SETTINGS_PRINCIPAL_URL') {
        store.setState({
          caldavSaveSettingsStatus: CalDAVStatus.RetrievePrincipalUrlError
        });
      } else if (responseMessage === 'CALDAV_BAD_SETTINGS_HOME_URL') {
        store.setState({
          caldavSaveSettingsStatus: CalDAVStatus.RetrieveHomeUrlError
        });
      } else {
        store.setState({
          caldavSaveSettingsStatus: CalDAVStatus.Error
        });
      }
    }
  },
  async cleanUp(state) {
    store.setState({
      caldavCleanUpStatus: CalDAVStatus.Getting,
      caldavSaveSettingsStatus: null,
      caldavSyncStatus: null
    });

    try {
      await state.httpClient.get('/api/v1/service/caldav/cleanup');
      store.setState({
        caldavCleanUpStatus: CalDAVStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavCleanUpStatus: CalDAVStatus.Error
      });
    }
  },
  async startSync(state) {
    store.setState({
      caldavSyncStatus: CalDAVStatus.Getting,
      caldavSaveSettingsStatus: null,
      caldavCleanUpStatus: null
    });
    try {
      await state.httpClient.get('/api/v1/service/caldav/sync');
      store.setState({
        caldavSyncStatus: CalDAVStatus.Success
      });
    } catch (e) {
      const responseMessage = get(e, 'response.data.message');
      if (responseMessage === 'SERVICE_NOT_CONFIGURED') {
        store.setState({
          caldavSyncStatus: CalDAVStatus.BadCredentialsError
        });
      } else if (responseMessage === 'CALDAV_FAILED_REQUEST_CALENDARS') {
        store.setState({
          caldavSyncStatus: CalDAVStatus.RequestCalendarsError
        });
      } else if (responseMessage === 'CALDAV_FAILED_REQUEST_CHANGES') {
        store.setState({
          caldavSyncStatus: CalDAVStatus.RequestChangesError
        });
      } else if (responseMessage === 'CALDAV_FAILED_REQUEST_EVENTS') {
        store.setState({
          caldavSyncStatus: CalDAVStatus.RequestEventsError
        });
      } else {
        store.setState({
          caldavSyncStatus: CalDAVStatus.Error
        });
      }
    }
  }
});

export default actions;
