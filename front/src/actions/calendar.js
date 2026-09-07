import { CalendarGetEventsStatus } from '../utils/consts';

function createActions(store) {
  const actions = {
    async getEventsInRange(state, from, to) {
      store.setState({
        DeviceGetStatus: CalendarGetEventsStatus.Getting
      });
      try {
        const events = await state.httpClient.get('/api/v1/calendar/event', {
          from,
          to,
          shared: true
        });
        const calendars = await state.httpClient.get('/api/v1/calendar');
        const eventsFormated = events.map(event => {
          // the event may belong to a shared calendar absent from the list:
          // never crash the view on a missing calendar or color
          const calendar = calendars.find(oneCalendar => oneCalendar.id === event.calendar_id);
          return {
            title: event.name,
            start: new Date(event.start),
            end: new Date(event.end),
            allDay: event.full_day,
            color: (calendar && calendar.color) || null
          };
        });
        store.setState({
          eventsFormated,
          calendars,
          DeviceGetStatus: CalendarGetEventsStatus.Success
        });
      } catch (e) {
        store.setState({
          DeviceGetStatus: CalendarGetEventsStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
