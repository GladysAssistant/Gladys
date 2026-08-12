import { CalDAVStatus } from '../../../../../utils/consts';

const actions = store => ({
  updateCalendarSharing(state, e) {
    store.setState({
      calendarsSharing: {
        ...state.calendarsSharing,
        [e.target.name]: e.target.checked
      }
    });
  },
  async getCaldavSetting(state) {
    store.setState({
      caldavGetSettingsStatus: CalDAVStatus.Getting
    });

    let caldavCalendars = [];
    let gladysUsers = [];

    store.setState({
      caldavCalendars,
      gladysUsers
    });

    try {
      const calendars = await state.httpClient.get('/api/v1/calendar', {
        serviceName: 'caldav'
      });
      caldavCalendars = calendars;

      const users = await state.httpClient.get('/api/v1/user');
      gladysUsers = users
        .map(u => ({
          label: u.firstname,
          value: u.id
        }))
        .filter(u => u.value !== state.session.user.id);

      store.setState({
        caldavGetSettingsStatus: CalDAVStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavGetSettingsStatus: CalDAVStatus.Error
      });
    }

    store.setState({
      caldavCalendars,
      gladysUsers
    });
  },
  async saveCaldavSettings(state) {
    store.setState({
      caldavSaveSharingStatus: CalDAVStatus.Getting
    });
    try {
      // save calendars sharing changes
      const updatedCalendars = await Promise.all(
        Object.keys(state.calendarsSharing).map(selector => {
          return state.httpClient.patch(`/api/v1/calendar/${selector}`, {
            // selector
            shared: state.calendarsSharing[selector]
          });
        })
      );
      store.setState({
        caldavCalendars: state.caldavCalendars.map(caldavCalendar => {
          const currentUpdatedCalendar = updatedCalendars.filter(
            updatedCalendar => updatedCalendar.id === caldavCalendar.id
          );
          return currentUpdatedCalendar.length === 0 ? caldavCalendar : currentUpdatedCalendar[0];
        }),
        calendarsSharing: undefined,
        caldavSaveSharingStatus: CalDAVStatus.Success
      });
    } catch (e) {
      store.setState({
        caldavSaveSharingStatus: CalDAVStatus.Error
      });
    }
  }
});

export default actions;
