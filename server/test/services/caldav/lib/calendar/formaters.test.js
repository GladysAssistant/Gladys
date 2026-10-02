const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const dayjs = require('dayjs');
const originalDuration = require('dayjs/plugin/duration');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const isBetween = require('dayjs/plugin/isBetween');
const utc = require('dayjs/plugin/utc');
const logger = require('../../../../../utils/logger');
const {
  formatEvents,
  formatRecurringEvents,
  formatCalendars,
} = require('../../../../../services/caldav/lib/calendar/calendar.formaters');

dayjs.extend(originalDuration);
dayjs.extend(advancedFormat);
dayjs.extend(isBetween);
dayjs.extend(utc);

/**
 * @description Dayjs with UTC for test (can't use dayjs.utc.duration).
 * @param {*} date - Initial date.
 * @returns {object} Dayjs instance.
 * @example
 * dayjsUTCOverride(1619816485)
 */
function dayjsUTCOverride(date) {
  return dayjs.utc(date);
}

dayjsUTCOverride.duration = function duration(number) {
  return dayjs.duration(number);
};

dayjsUTCOverride.tz = function tz(date, timezoneValue) {
  // The dayjs timezone plugin relies on Intl.DateTimeFormat, which throws a
  // RangeError when the timezone is not a valid IANA name. We reproduce that
  // behaviour here so tests exercise the real failure mode.
  Intl.DateTimeFormat(undefined, { timeZone: timezoneValue });
  return dayjs.utc(date);
};

describe('CalDAV formaters', () => {
  let caldavCalendars;
  let expectedCalendars;
  let events;
  let expectedEvents;
  let recurrEvents;
  let expectedRecurrEvents;
  let formatter;
  before(() => {
    caldavCalendars = [
      {
        url: 'https://caldav.com/calendar1/',
        displayName: 'Calendar 1',
        description: 'Description calendar 1',
        color: '#c4391d',
        ctag: 'ctag1',
        syncToken: 'syncToken1',
        type: 'CALDAV',
      },
      {
        url: 'https://caldav.com/calendar2/',
        displayName: 'Calendar 2',
        ctag: 'ctag2',
        syncToken: 'syncToken2',
        type: 'CALDAV',
      },
    ];

    expectedCalendars = [
      {
        external_id: 'https://caldav.com/calendar1/',
        name: 'Calendar 1',
        description: 'Description calendar 1',
        color: '#c4391d',
        service_id: '5d6c666f-56be-4929-9104-718a78556844',
        user_id: '745d3ccc-ddc6-4dc5-a776-5d2ac7682d25',
        ctag: 'ctag1',
        sync_token: 'syncToken1',
        sync: true,
        type: 'CALDAV',
      },
      {
        external_id: 'https://caldav.com/calendar2/',
        name: 'Calendar 2',
        description: 'Calendar Calendar 2',
        color: '#3174ad',
        service_id: '5d6c666f-56be-4929-9104-718a78556844',
        user_id: '745d3ccc-ddc6-4dc5-a776-5d2ac7682d25',
        ctag: 'ctag2',
        sync_token: 'syncToken2',
        sync: true,
        type: 'CALDAV',
      },
    ];

    events = [
      {
        type: 'VEVENT',
        uid: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
        summary: 'Event 1',
        start: new Date('2019-02-25T10:00:00Z'),
        end: new Date('2019-02-25T12:00:00Z'),
        location: 'Paris',
        description: 'Description event 1',
        href: 'https://caldav.host/home/event1.ics',
      },
      {
        type: 'VEVENT',
        uid: '71c01038-2231-4dee-a230-6820fdb1136e',
        summary: 'Event 2',
        start: new Date('2019-04-01T00:00:00Z'),
        end: new Date('2019-04-02T00:00:00Z'),
        location: 'Toulouse',
        description: 'Description event 2',
        href: 'https://caldav.host/home/event2.ics',
      },
      {
        type: 'BAD_TYPE',
        uid: '932394cb-80ec-4871-bce3-4bebe28ac1e0',
        summary: 'Event 3',
        start: new Date('2019-05-08T15:00:00Z'),
        location: 'Lyon',
        description: 'Description event 3',
      },
      {
        type: 'VEVENT',
        uid: '29f76a08-5439-4e04-bc1f-a67c32b47c80',
        start: new Date('2019-09-27T00:00:00Z'),
        summary: 'Anniversaire Pepper',
        location: 'Paris',
        description: 'Description event 4',
        rrule: {
          between: sinon
            .stub()
            .returns([
              new Date('2019-09-27T00:00:00Z'),
              new Date('2020-09-27T00:00:00Z'),
              new Date('2021-09-27T00:00:00Z'),
            ]),
          after: sinon.stub().returns(new Date('2019-09-27T00:00:00Z')),
        },
        href: 'https://caldav.host.com/home/recur-event2',
      },
    ];

    expectedEvents = [
      {
        external_id: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
        selector: 'e52c11e3-af8a-48c7-9f54-de7aba373c46',
        name: 'Event 1',
        location: 'Paris',
        description: 'Description event 1',
        start: '2019-02-25T10:00:00+00:00',
        end: '2019-02-25T12:00:00+00:00',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        url: 'https://caldav.host/home/event1.ics',
      },
      {
        external_id: '71c01038-2231-4dee-a230-6820fdb1136e',
        selector: '71c01038-2231-4dee-a230-6820fdb1136e',
        name: 'Event 2',
        location: 'Toulouse',
        description: 'Description event 2',
        start: '2019-04-01T00:00:00+00:00',
        end: '2019-04-02T00:00:00+00:00',
        full_day: true,
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        url: 'https://caldav.host/home/event2.ics',
      },
      {
        external_id: '29f76a08-5439-4e04-bc1f-a67c32b47c802019-09-27-00-00',
        selector: '29f76a08-5439-4e04-bc1f-a67c32b47c802019-09-27-00-00',
        name: 'Anniversaire Pepper',
        location: 'Paris',
        description: 'Description event 4',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        full_day: true,
        start: '2019-09-27T00:00:00+00:00',
        end: '2019-09-28T00:00:00+00:00',
        url: 'https://caldav.host.com/home/recur-event2',
      },
      {
        external_id: '29f76a08-5439-4e04-bc1f-a67c32b47c802020-09-27-00-00',
        selector: '29f76a08-5439-4e04-bc1f-a67c32b47c802020-09-27-00-00',
        name: 'Anniversaire Pepper',
        location: 'Paris',
        description: 'Description event 4',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        full_day: true,
        start: '2020-09-27T00:00:00+00:00',
        end: '2020-09-28T00:00:00+00:00',
        url: 'https://caldav.host.com/home/recur-event2',
      },
      {
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        external_id: '29f76a08-5439-4e04-bc1f-a67c32b47c802021-09-27-00-00',
        full_day: true,
        location: 'Paris',
        description: 'Description event 4',
        name: 'Anniversaire Pepper',
        selector: '29f76a08-5439-4e04-bc1f-a67c32b47c802021-09-27-00-00',
        start: '2021-09-27T00:00:00+00:00',
        end: '2021-09-28T00:00:00+00:00',
        url: 'https://caldav.host.com/home/recur-event2',
      },
    ];

    const start1 = new Date('2019-06-01T09:00:00Z');
    Object.defineProperty(start1, 'tz', { value: 'Europe/London' });
    const start2 = new Date('2019-06-08T09:00:00Z');
    Object.defineProperty(start2, 'tz', { value: 'Europe/London' });
    const start3 = new Date('2019-06-10T09:00:00Z');
    Object.defineProperty(start3, 'tz', { value: 'Europe/London' });
    const start4 = new Date('2019-06-20T16:00:00Z');
    Object.defineProperty(start4, 'tz', { value: 'Europe/London' });
    recurrEvents = [
      {
        uid: 'fdc2bf57-0adb-4300-8287-4a9b34dc3786',
        start: start1,
        end: new Date('2019-06-01T12:00:00Z'),
        summary: 'Cours de tennis',
        location: 'Stade Roland-Garros',
        description: 'Terre battue',
        rrule: {
          between: sinon.stub().returns([new Date('2019-06-01T09:00:00Z'), new Date('2019-06-15T09:00:00Z')]),
          after: sinon.stub().returns(new Date('2019-06-01T09:00:00Z')),
        },
        recurrences: {
          '2017-06-02T12:00:00Z': {},
        },
        exdate: {
          '2019-06-15': {
            message: 'Cours de tennis annulé',
          },
        },
        href: 'https://caldav.host.com/home/recur-event1',
      },
      {
        uid: '29f76a08-5439-4e04-bc1f-a67c32b47c80',
        start: new Date('2019-09-27T00:00:00Z'),
        summary: 'Anniversaire Pepper',
        location: 'Paris',
        description: 'Penser à commander un Saint-Honoré',
        rrule: {
          between: sinon
            .stub()
            .returns([
              new Date('2019-09-27T00:00:00Z'),
              new Date('2020-09-27T00:00:00Z'),
              new Date('2021-09-27T00:00:00Z'),
            ]),
          after: sinon.stub().returns(new Date('2019-09-27T00:00:00Z')),
        },
        href: 'https://caldav.host.com/home/recur-event2',
      },
      {
        uid: '7de4104e-f46d-43e4-a62f-4d7c53c1ff71',
        start: start3,
        end: new Date('2019-06-10T10:00:00Z'),
        summary: 'Réunion Avengers',
        location: 'Tour Stark',
        description: 'Discussion hebdomadaire',
        rrule: {
          between: sinon
            .stub()
            .returns([
              new Date('2019-06-10T09:00:00Z'),
              new Date('2019-06-17T09:00:00Z'),
              new Date('2019-06-24T09:00:00Z'),
            ]),
          after: sinon.stub().returns(new Date('2019-06-10T09:00:00Z')),
        },
        recurrences: {
          '2019-06-10': {
            start: start3,
            end: new Date('2019-06-10T10:00:00Z'),
            summary: 'Réunion Avengers',
          },
          '2019-06-17': {
            start: new Date('2019-06-17T09:00:00Z'),
            end: new Date('2019-06-17T10:00:00Z'),
            summary: 'Réunion Avengers',
            status: 'CANCELLED',
          },
          '2019-06-24': {
            start: new Date('2019-06-24T09:00:00Z'),
            end: new Date('2019-06-24T10:00:00Z'),
            summary: 'Réunion Avengers, nouvel arrivant',
          },
        },
        href: 'https://caldav.host.com/home/recur-event3',
      },
      {
        uid: '30514e5d-8e2d-4e7b-9960-62ebf9e6f342',
        start: start4,
        duration: 5400000,
        summary: 'Gouter',
        location: 'Jardin',
        rrule: {
          between: sinon.stub().returns([new Date('2019-06-20T16:00:00Z'), new Date('2019-06-21T16:00:00Z')]),
          after: sinon.stub().returns(new Date('2019-06-20T16:00:00Z')),
        },
        href: 'https://caldav.host.com/home/recur-event4',
      },
    ];

    expectedRecurrEvents = [
      [
        {
          external_id: 'fdc2bf57-0adb-4300-8287-4a9b34dc37862019-06-01-09-00',
          selector: 'fdc2bf57-0adb-4300-8287-4a9b34dc37862019-06-01-09-00',
          name: 'Cours de tennis',
          location: 'Stade Roland-Garros',
          description: 'Terre battue',
          calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
          start: '2019-06-01T09:00:00+00:00',
          end: '2019-06-01T12:00:00+00:00',
          url: 'https://caldav.host.com/home/recur-event1',
        },
        null,
        null,
      ],
      [
        {
          external_id: '29f76a08-5439-4e04-bc1f-a67c32b47c802019-09-27-00-00',
          selector: '29f76a08-5439-4e04-bc1f-a67c32b47c802019-09-27-00-00',
          name: 'Anniversaire Pepper',
          location: 'Paris',
          description: 'Penser à commander un Saint-Honoré',
          calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
          full_day: true,
          start: '2019-09-27T00:00:00+00:00',
          end: '2019-09-28T00:00:00+00:00',
          url: 'https://caldav.host.com/home/recur-event2',
        },
        {
          external_id: '29f76a08-5439-4e04-bc1f-a67c32b47c802020-09-27-00-00',
          selector: '29f76a08-5439-4e04-bc1f-a67c32b47c802020-09-27-00-00',
          name: 'Anniversaire Pepper',
          location: 'Paris',
          description: 'Penser à commander un Saint-Honoré',
          calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
          full_day: true,
          start: '2020-09-27T00:00:00+00:00',
          end: '2020-09-28T00:00:00+00:00',
          url: 'https://caldav.host.com/home/recur-event2',
        },
        null,
      ],
      [
        {
          external_id: '7de4104e-f46d-43e4-a62f-4d7c53c1ff712019-06-10-09-00',
          selector: '7de4104e-f46d-43e4-a62f-4d7c53c1ff712019-06-10-09-00',
          name: 'Réunion Avengers',
          location: 'Tour Stark',
          description: 'Discussion hebdomadaire',
          calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
          start: '2019-06-10T09:00:00+00:00',
          end: '2019-06-10T10:00:00+00:00',
          url: 'https://caldav.host.com/home/recur-event3',
        },
        null,
        {
          external_id: '7de4104e-f46d-43e4-a62f-4d7c53c1ff712019-06-24-09-00',
          selector: '7de4104e-f46d-43e4-a62f-4d7c53c1ff712019-06-24-09-00',
          name: 'Réunion Avengers, nouvel arrivant',
          location: 'Tour Stark',
          description: 'Discussion hebdomadaire',
          calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
          start: '2019-06-24T09:00:00+00:00',
          end: '2019-06-24T10:00:00+00:00',
          url: 'https://caldav.host.com/home/recur-event3',
        },
      ],
      [
        {
          external_id: '30514e5d-8e2d-4e7b-9960-62ebf9e6f3422019-06-20-16-00',
          selector: '30514e5d-8e2d-4e7b-9960-62ebf9e6f3422019-06-20-16-00',
          name: 'Gouter',
          location: 'Jardin',
          description: undefined,
          calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
          start: '2019-06-20T16:00:00+00:00',
          end: '2019-06-20T17:30:00+00:00',
          url: 'https://caldav.host.com/home/recur-event4',
        },
        {
          external_id: '30514e5d-8e2d-4e7b-9960-62ebf9e6f3422019-06-21-16-00',
          selector: '30514e5d-8e2d-4e7b-9960-62ebf9e6f3422019-06-21-16-00',
          name: 'Gouter',
          location: 'Jardin',
          description: undefined,
          calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
          start: '2019-06-21T16:00:00+00:00',
          end: '2019-06-21T17:30:00+00:00',
          url: 'https://caldav.host.com/home/recur-event4',
        },
      ],
    ];

    formatter = {
      serviceId: '5d6c666f-56be-4929-9104-718a78556844',
      formatCalendars,
      formatEvents,
      formatRecurringEvents,
      dayjs: dayjsUTCOverride,
    };
    const start = new Date('2019-02-25T10:00:00Z');
    Object.defineProperty(start, 'tz', { value: 'Europe/London' });
  });

  it('should format calendars', () => {
    const formattedCalendars = formatter.formatCalendars(caldavCalendars, '745d3ccc-ddc6-4dc5-a776-5d2ac7682d25');
    expect(formattedCalendars).to.eql(expectedCalendars);
  });

  it('should format events', () => {
    const clock = sinon.useFakeTimers(new Date('2020-05-01T00:00:00Z').getTime());
    const formattedEvents = formatter.formatEvents(events, {
      id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
    });
    clock.restore();
    expect(formattedEvents).to.eql(expectedEvents);
  });

  it('should format events with a fixed offset timezone', () => {
    const start = new Date('2026-02-25T10:00:00Z');
    Object.defineProperty(start, 'tz', { value: 'GMT+1100' });
    const end = new Date('2026-02-25T12:00:00Z');
    Object.defineProperty(end, 'tz', { value: 'GMT+1100' });

    const formattedEvents = formatter.formatEvents(
      [
        {
          type: 'VEVENT',
          uid: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a01',
          summary: 'Event with GMT offset',
          location: 'Sydney',
          description: 'Description event with GMT offset',
          start,
          end,
          href: 'https://caldav.host/home/event-gmt.ics',
        },
      ],
      { id: '1fe8f557-2685-4b6b-8f05-238184f6b701' },
    );

    expect(formattedEvents).to.eql([
      {
        external_id: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a01',
        selector: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a01',
        name: 'Event with GMT offset',
        location: 'Sydney',
        description: 'Description event with GMT offset',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        start: '2026-02-24T23:00:00+00:00',
        end: '2026-02-25T01:00:00+00:00',
        url: 'https://caldav.host/home/event-gmt.ics',
      },
    ]);
  });

  it('should format an event with a UTC offset timezone and a duration', () => {
    const clock = sinon.useFakeTimers(new Date('2020-05-01T00:00:00Z').getTime());
    const start = new Date('2026-03-01T08:30:00Z');
    Object.defineProperty(start, 'tz', { value: 'UTC-02:00' });

    const formattedEvents = formatter.formatEvents(
      [
        {
          type: 'VEVENT',
          uid: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a02',
          summary: 'Event with UTC offset',
          location: 'Fernando de Noronha',
          description: 'Description event with UTC offset',
          start,
          duration: 5400000,
          href: 'https://caldav.host/home/event-utc.ics',
        },
      ],
      { id: '1fe8f557-2685-4b6b-8f05-238184f6b701' },
    );
    clock.restore();

    expect(formattedEvents).to.eql([
      {
        external_id: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a02',
        selector: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a02',
        name: 'Event with UTC offset',
        location: 'Fernando de Noronha',
        description: 'Description event with UTC offset',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        start: '2026-03-01T10:30:00+00:00',
        end: '2026-03-01T12:00:00+00:00',
        url: 'https://caldav.host/home/event-utc.ics',
      },
    ]);
  });

  it('should format a full day event without end date', () => {
    const clock = sinon.useFakeTimers(new Date('2020-05-01T00:00:00Z').getTime());

    const formattedEvents = formatter.formatEvents(
      [
        {
          type: 'VEVENT',
          uid: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a03',
          summary: 'Full day event',
          location: 'Paris',
          description: 'Description full day event',
          start: new Date('2026-01-01T00:00:00Z'),
          href: 'https://caldav.host/home/event-full-day.ics',
        },
      ],
      { id: '1fe8f557-2685-4b6b-8f05-238184f6b701' },
    );
    clock.restore();

    expect(formattedEvents).to.eql([
      {
        external_id: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a03',
        selector: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a03',
        name: 'Full day event',
        location: 'Paris',
        description: 'Description full day event',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        full_day: true,
        start: '2026-01-01T00:00:00+00:00',
        end: '2026-01-02T00:00:00+00:00',
        url: 'https://caldav.host/home/event-full-day.ics',
      },
    ]);
  });

  it('should fallback to the server timezone when the timezone is unknown', () => {
    const warnStub = sinon.stub(logger, 'warn');
    const start = new Date('2026-02-25T10:00:00Z');
    Object.defineProperty(start, 'tz', { value: 'Unknown/Timezone' });
    const end = new Date('2026-02-25T12:00:00Z');
    Object.defineProperty(end, 'tz', { value: 'Unknown/Timezone' });

    const formattedEvents = formatter.formatEvents(
      [
        {
          type: 'VEVENT',
          uid: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a04',
          summary: 'Event with unknown timezone',
          location: 'Nowhere',
          description: 'Description event with unknown timezone',
          start,
          end,
          href: 'https://caldav.host/home/event-unknown.ics',
        },
      ],
      { id: '1fe8f557-2685-4b6b-8f05-238184f6b701' },
    );

    expect(formattedEvents).to.eql([
      {
        external_id: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a04',
        selector: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a04',
        name: 'Event with unknown timezone',
        location: 'Nowhere',
        description: 'Description event with unknown timezone',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        start: '2026-02-25T10:00:00+00:00',
        end: '2026-02-25T12:00:00+00:00',
        url: 'https://caldav.host/home/event-unknown.ics',
      },
    ]);
    expect(warnStub.called).to.equal(true);
    warnStub.restore();
  });

  it('should skip an event which cannot be formatted and keep the other ones', () => {
    const warnStub = sinon.stub(logger, 'warn');

    const formattedEvents = formatter.formatEvents(
      [
        {
          type: 'VEVENT',
          uid: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a05',
          summary: 'Broken recurring event',
          start: new Date('2026-04-01T10:00:00Z'),
          rrule: {
            between: sinon.stub().throws(new Error('Invalid recurrence rule')),
            after: sinon.stub().returns(new Date('2026-04-01T10:00:00Z')),
          },
          href: 'https://caldav.host/home/event-broken.ics',
        },
        {
          type: 'VEVENT',
          uid: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a06',
          summary: 'Valid event',
          location: 'Paris',
          description: 'Description valid event',
          start: new Date('2026-04-02T10:00:00Z'),
          end: new Date('2026-04-02T11:00:00Z'),
          href: 'https://caldav.host/home/event-valid.ics',
        },
      ],
      { id: '1fe8f557-2685-4b6b-8f05-238184f6b701' },
    );

    expect(formattedEvents).to.eql([
      {
        external_id: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a06',
        selector: 'c1f0a2d6-5c3f-4b5e-9a1e-0f4f8c5f1a06',
        name: 'Valid event',
        location: 'Paris',
        description: 'Description valid event',
        calendar_id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
        start: '2026-04-02T10:00:00+00:00',
        end: '2026-04-02T11:00:00+00:00',
        url: 'https://caldav.host/home/event-valid.ics',
      },
    ]);
    expect(warnStub.called).to.equal(true);
    warnStub.restore();
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

  it('should format recurr events with specific recurrences', () => {
    const clock = sinon.useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const formattedEvents = formatter.formatRecurringEvents(recurrEvents[2], {
      id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
    });
    clock.restore();
    expect(formattedEvents).to.eql(expectedRecurrEvents[2]);
  });

  it('should format recurr events with duration', () => {
    const clock = sinon.useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const formattedEvents = formatter.formatRecurringEvents(recurrEvents[3], {
      id: '1fe8f557-2685-4b6b-8f05-238184f6b701',
    });
    clock.restore();
    expect(formattedEvents).to.eql(expectedRecurrEvents[3]);
  });
  it('should format events with property parameters', () => {
    const formattedEvents = formatter.formatEvents(
      [
        {
          type: 'VEVENT',
          uid: 'a1b2c3',
          summary: { params: { LANGUAGE: 'en-US' }, val: 'Entretien visio' },
          location: { params: { LANGUAGE: 'en-US' }, val: 'Paris' },
          description: { params: { LANGUAGE: 'en-US' }, val: 'Description' },
          start: new Date('2019-06-01T09:00:00Z'),
          end: new Date('2019-06-01T10:00:00Z'),
          href: 'https://caldav.host.com/home/event-params',
        },
      ],
      { id: '1fe8f557-2685-4b6b-8f05-238184f6b701' },
    );
    expect(formattedEvents).to.have.lengthOf(1);
    expect(formattedEvents[0]).to.include({
      name: 'Entretien visio',
      location: 'Paris',
      description: 'Description',
    });
  });

  it('should format recurr events with property parameters', () => {
    const clock = sinon.useFakeTimers(new Date('2019-05-01T00:00:00Z').getTime());
    const start = new Date('2019-06-01T09:00:00Z');
    Object.defineProperty(start, 'tz', { value: 'Europe/Paris' });
    const formattedEvents = formatter.formatRecurringEvents(
      {
        uid: 'd4e5f6',
        start,
        end: new Date('2019-06-01T10:00:00Z'),
        summary: { params: { LANGUAGE: 'en-US' }, val: 'Entretien visio' },
        location: { params: { LANGUAGE: 'en-US' }, val: 'Paris' },
        description: { params: { LANGUAGE: 'en-US' }, val: 'Description' },
        rrule: {
          between: sinon.stub().returns([new Date('2019-06-01T09:00:00Z')]),
          after: sinon.stub().returns(new Date('2019-06-01T09:00:00Z')),
        },
        href: 'https://caldav.host.com/home/recur-event-params',
      },
      { id: '1fe8f557-2685-4b6b-8f05-238184f6b701' },
    );
    clock.restore();
    expect(formattedEvents).to.have.lengthOf(1);
    expect(formattedEvents[0]).to.include({
      name: 'Entretien visio',
      location: 'Paris',
      description: 'Description',
    });
  });
});
