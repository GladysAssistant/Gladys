const { expect } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const {
  formatEvents,
  formatRecurringEvents,
  formatCalendars,
} = require('../../../../../services/caldav/lib/calendar/calendar.formaters');

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
    start: '2019-02-25T10:00:00.000Z',
    end: '2019-02-25T12:00:00.000Z',
    calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
  },
  {
    external_id: '71c01038-2231-4dee-a230-6820fdb1136e',
    selector: 'Event 2 2019-04-01-0000',
    name: 'Event 2',
    location: 'Toulouse',
    start: '2019-04-01T00:00:00.000Z',
    end: '2019-04-02T00:00:00.000Z',
    full_day: true,
    calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
  },
];

const start1 = new Date('2019-06-01T09:00:00Z');
Object.defineProperty(start1, 'tz', { value: 'Europe/London' });
const start2 = new Date('2019-06-08T09:00:00Z');
Object.defineProperty(start2, 'tz', { value: 'Europe/London' });
const recurrEvents = [
  {
    uid: 'fdc2bf57-0adb-4300-8287-4a9b34dc3786',
    start: start1,
    end: new Date('2019-06-01T12:00:00Z'),
    summary: 'Cours de tennis',
    location: 'Stade Roland-Garros',
    rrule: {
      between: sinon.stub().returns([new Date('2019-06-01T09:00:00Z'), new Date('2019-06-15T09:00:00Z')]),
    },
    recurrences: [
      '2017-06-02T12:00:00Z',
      // '2019-06-08': {
      //   start: start2,
      //   end: new Date('2019-06-08T12:00:00Z'),
      //   summary: 'Cours de tennis différent',
      // },
    ],
    exdate: {
      '2019-06-15': {
        message: 'Cours de tennis annulé',
      },
    },
  },
  {
    uid: '29f76a08-5439-4e04-bc1f-a67c32b47c80',
    start: new Date('2019-09-27T00:00:00Z'),
    summary: 'Anniversaire Pepper',
    location: 'Paris',
    rrule: {
      between: sinon
        .stub()
        .returns([
          new Date('2019-09-27T00:00:00Z'),
          new Date('2020-09-27T00:00:00Z'),
          new Date('2021-09-27T00:00:00Z'),
        ]),
    },
  },
];

const expectedRecurrEvents = [
  [
    {
      external_id: 'fdc2bf57-0adb-4300-8287-4a9b34dc37860',
      selector: 'Cours de tennis 2019-06-01-0900',
      name: 'Cours de tennis',
      location: 'Stade Roland-Garros',
      calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
      start: '2019-06-01T09:00:00.000Z',
      end: '2019-06-01T12:00:00.000Z',
    },
    null,
    null,
  ],
  [
    {
      external_id: '29f76a08-5439-4e04-bc1f-a67c32b47c800',
      selector: 'Anniversaire Pepper 2019-09-27-0000',
      name: 'Anniversaire Pepper',
      location: 'Paris',
      calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
      full_day: true,
      start: '2019-09-27T00:00:00.000Z',
      end: '2019-09-28T00:00:00.000Z',
    },
    {
      external_id: '29f76a08-5439-4e04-bc1f-a67c32b47c801',
      selector: 'Anniversaire Pepper 2020-09-27-0000',
      name: 'Anniversaire Pepper',
      location: 'Paris',
      calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
      full_day: true,
      start: '2020-09-27T00:00:00.000Z',
      end: '2020-09-28T00:00:00.000Z',
    },
    null,
  ],
];

describe('CalDAV formaters', () => {
  const formatter = {
    serviceId: '5d6c666f-56be-4929-9104-718a78556844',
    formatCalendars,
    formatEvents,
    formatRecurringEvents,
    moment: moment.utc,
    ical: { parseICS: sinon.stub() },
  };
  const start = new Date('2019-02-25T10:00:00Z');
  Object.defineProperty(start, 'tz', { value: 'Europe/London' });
  formatter.ical.parseICS
    .onFirstCall()
    .returns({
      event: {
        type: 'VEVENT',
        uid: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
        summary: 'Event 1',
        start,
        end: new Date('2019-02-25T12:00:00Z'),
        location: 'Paris',
      },
    })
    .onSecondCall()
    .returns({
      event: {
        type: 'VEVENT',
        uid: '71c01038-2231-4dee-a230-6820fdb1136e',
        summary: 'Event 2',
        start: new Date('2019-04-01T00:00:00Z'),
        end: new Date('2019-04-02T00:00:00Z'),
        location: 'Toulouse',
      },
    })
    .onThirdCall()
    .returns({
      event: {
        type: 'BAD_TYPE',
        uid: '932394cb-80ec-4871-bce3-4bebe28ac1e0',
        summary: 'Event 3',
        start: new Date('2019-05-08T15:00:00Z'),
        location: 'Lyon',
      },
    });

  it('should format calendars', () => {
    const formattedCalendars = formatter.formatCalendars(caldavCalendars, '745d3ccc-ddc6-4dc5-a776-5d2ac7682d25');
    expect(formattedCalendars).to.eql(expectedCalendars);
  });

  it('should format events', () => {
    const formattedEvents = formatter.formatEvents(['event1', 'event2', 'event3'], {
      id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
    });
    expect(formattedEvents).to.eql(expectedEvents);
  });

  it('should format recurr events', () => {
    const clock = sinon.useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const formattedEvents = formatter.formatRecurringEvents(recurrEvents[0], {
      id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
    });
    clock.restore();
    expect(formattedEvents).to.eql(expectedRecurrEvents[0]);
  });

  it('should format full day recurr events', () => {
    const clock = sinon.useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const formattedEvents = formatter.formatRecurringEvents(recurrEvents[1], {
      id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
    });
    clock.restore();
    expect(formattedEvents).to.eql(expectedRecurrEvents[1]);
  });
});
