import { CalDAVStatus } from '../../../../../utils/consts';

const actions = store => ({
  updateCalendarsToSync(state, e) {
    store.setState({
      calendarsToSync: {
        ...state.calendarsToSync,
        [e.target.name]: e.target.checked
      }
    });
  },
  async getCaldavSetting(state) {
    store.setState({
      caldavGetSettingsStatus: CalDAVStatus.Getting
    });

    let caldavCalendars = [];

    store.setState({
      caldavCalendars
    });

    try {
      const calendars = await state.httpClient.get('/api/v1/calendar', {
        serviceName: 'caldav'
      });
      caldavCalendars = calendars;

      store.setState({
        caldavGetSettingsStatus: CalDAVStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavGetSettingsStatus: CalDAVStatus.Error
      });
    }

    store.setState({
      caldavCalendars
    });
  },
  async saveCaldavSettings(state) {
    store.setState({
      caldavSaveSyncStatus: CalDAVStatus.Getting
    });
    try {
      // save calendars sync changes
      const updatedCalendars = await Promise.all(
        Object.keys(state.calendarsToSync).map(selector => {
          return state.httpClient.patch(
            `/api/v1/service/caldav/${state.calendarsToSync[selector] ? 'enable' : 'disable'}`,
            {
              selector
            }
          );
        })
      );
      store.setState({
        caldavCalendars: state.caldavCalendars.map(caldavCalendar => {
          const currentUpdatedCalendar = updatedCalendars.filter(
            updatedCalendar => updatedCalendar.id === caldavCalendar.id
          );
          return currentUpdatedCalendar.length === 0 ? caldavCalendar : currentUpdatedCalendar[0];
        }),
        calendarsToSync: undefined,
        caldavSaveSyncStatus: CalDAVStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavSaveSyncStatus: CalDAVStatus.Error
      });
    }
  }
});

export default actions;
