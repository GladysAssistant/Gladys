const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const { formatEvents, formatCalendars } = require('../../../services/caldav/lib/calendar/calendar.formaters');

// Format calendars
const caldavCalendars = [
  {
    url: 'https://caldav.com/calendar1/',
    displayName: 'Calendar 1',
    description: 'Description calendar 1',
  },
  {
    url: 'https://caldav.com/calendar2/',
    displayName: 'Calendar 2',
  },
];

const expectedCalendars = [
  {
    external_id: 'https://caldav.com/calendar1/',
    name: 'Calendar 1',
    description: 'Description calendar 1',
    service_id: '5d6c666f-56be-4929-9104-718a78556844',
    user_id: '745d3ccc-ddc6-4dc5-a776-5d2ac7682d25',
  },
  {
    external_id: 'https://caldav.com/calendar2/',
    name: 'Calendar 2',
    description: 'Calendar Calendar 2',
    service_id: '5d6c666f-56be-4929-9104-718a78556844',
    user_id: '745d3ccc-ddc6-4dc5-a776-5d2ac7682d25',
  },
];

const expectedEvents = [
  {
    external_id: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
    selector: 'Event 1 2019-02-25-1000',
    name: 'Event 1',
    location: 'Paris',
    start: '2019-02-25T09:00:00.000Z',
    end: '2019-02-25T11:00:00.000Z',
    calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
  },
  {
    external_id: '71c01038-2231-4dee-a230-6820fdb1136e',
    selector: 'Event 2 2019-04-01-1000',
    name: 'Event 2',
    location: 'Toulouse',
    start: '2019-04-01T08:00:00.000Z',
    full_day: true,
    calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
  },
];

describe('CalDAV formaters', () => {
  const formatter = {
    serviceId: '5d6c666f-56be-4929-9104-718a78556844',
    formatCalendars,
    formatEvents,
    moment,
    ical: { parseICS: sinon.stub() },
  };
  const start = new Date('2019-02-25T10:00:00');
  Object.defineProperty(start, 'tz', { value: 'Europe/Paris' });
  formatter.ical.parseICS
    .onFirstCall()
    .returns({
      event: {
        type: 'VEVENT',
        uid: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
        summary: 'Event 1',
        start,
        end: new Date('2019-02-25T12:00:00'),
        location: 'Paris',
      },
    })
    .onSecondCall()
    .returns({
      event: {
        type: 'VEVENT',
        uid: '71c01038-2231-4dee-a230-6820fdb1136e',
        summary: 'Event 2',
        start: new Date('2019-04-01T10:00:00'),
        location: 'Toulouse',
      },
    });

  it('should format calendars', () => {
    const formattedCalendars = formatter.formatCalendars(caldavCalendars, '745d3ccc-ddc6-4dc5-a776-5d2ac7682d25');
    expect(formattedCalendars).to.eql(expectedCalendars);
  });
  it('should format events', () => {
    const formattedEvents = formatter.formatEvents(['event1', 'event2'], {
      id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
    });
    expect(formattedEvents).to.eql(expectedEvents);
  });
});
