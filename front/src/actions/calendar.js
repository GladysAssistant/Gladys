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
          to
        });
        const eventsFormated = events.map(event => {
          return {
            title: event.name,
            start: new Date(event.start),
            end: new Date(event.end),
            allDay: event.full_day
          };
        });
        store.setState({
          eventsFormated,
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
