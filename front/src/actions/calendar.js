import { CalendarGetEventsStatus } from '../utils/consts';

const HALF_A_DAY_IN_MS = 12 * 60 * 60 * 1000;

/**
 * Full-day events cover calendar dates (`end` exclusive) but are stored as
 * instants: at midnight UTC (CalDAV sync on a server running in UTC, events
 * created through the API) or at the midnight of the instance timezone
 * (external calendar integrations). In another browser timezone they no
 * longer fall on a local midnight (midnight UTC is 1am in Paris, 7pm the day
 * before in New York) and react-big-calendar spreads them over one more day.
 * Each bound is put back on the local midnight of the date it stands for: the
 * UTC date of a midnight UTC, else the nearest local midnight.
 */
const toLocalMidnight = date => {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  if (date.getTime() === utcMidnight) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (date.getTime() - localMidnight.getTime() > HALF_A_DAY_IN_MS) {
    localMidnight.setDate(localMidnight.getDate() + 1);
  }
  return localMidnight;
};

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
          const start = new Date(event.start);
          // `end` is optional (an external calendar integration may push
          // point-in-time events): new Date(null) would render in 1970
          const end = new Date(event.end || event.start);
          return {
            title: event.name,
            start: event.full_day ? toLocalMidnight(start) : start,
            end: event.full_day ? toLocalMidnight(end) : end,
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
