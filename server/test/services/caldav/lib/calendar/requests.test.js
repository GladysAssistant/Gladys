const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { fake } = sinon;
const moment = require('moment');
const {
  requestCalendars,
  requestChanges,
  requestEventsData,
} = require('../../../../../services/caldav/lib/calendar/calendar.requests');

chai.use(chaiAsPromised);
const { expect } = chai;

const namespace = {
  CALENDAR_SERVER: 'http://calendarserver.org/ns/',
  CALDAV_APPLE: 'http://apple.com/ns/ical/',
  CALDAV: 'urn:ietf:params:xml:ns:caldav',
  CARDDAV: 'urn:ietf:params:xml:ns:carddav',
  DAV: 'DAV:',
};

describe('CalDAV requests', () => {
  const requests = {
    serviceId: '5d6c666f-56be-4929-9104-718a78556844',
    requestCalendars,
    requestChanges,
    requestEventsData,
    moment: moment.utc,
    dav: {
      ns: namespace,
      request: {
        propfind: fake.returns({}),
        syncCollection: fake.returns({}),
      },
      Request: fake.returns({ requestDate: 'request3' }),
    },
    ical: {
      parseICS: fake.returns({
        data: {
          type: 'VEVENT',
          uid: '49193db9-f666-4947-8ce6-3357ce3b7166',
          summary: 'Evenement 1',
          start: new Date('2018-06-08'),
          end: new Date('2018-06-09'),
        },
      }),
    },
    xmlDom: {
      DOMParser: fake.returns({
        parseFromString: fake.returns({
          getElementsByTagName: fake.returns([
            {
              getElementsByTagName: fake.returns([
                { childNodes: [{ data: 'https://caldav.host.com/home/personal/event-1.ics' }] },
              ]),
            },
          ]),
        }),
      }),
    },
  };

  beforeEach(() => {
    sinon.reset();
  });

  it('should request calendars', async () => {
    const xhr = {
      send: fake.resolves([
        {
          props: {
            resourcetype: 'calendar',
            supportedCalendarComponentSet: ['VEVENT'],
            displayname: 'Calendrier 1',
            calendarDescription: 'Description 1',
            timezone: 'Europe/Paris',
            getctag: 'ctag1',
            syncToken: 'sync-token-1',
          },
          href: '/home/personal',
        },
        {
          props: {
            resourcetype: 'calendar',
            supportedCalendarComponentSet: ['VEVENT'],
            displayname: 'Calendrier 2',
            calendarDescription: 'Description 2',
            timezone: 'Europe/Paris',
            getctag: 'ctag22',
            syncToken: 'sync-token-22',
          },
          href: '/home/professional',
        },
        {
          props: {
            resourcetype: 'calendar',
            supportedCalendarComponentSet: ['VEVENT'],
            displayname: 'Calendrier 3',
            calendarDescription: 'Description 3',
            timezone: 'Europe/Paris',
            getctag: 'ctag3',
            syncToken: 'sync-token-3',
          },
          href: '/home/avengers',
        },
      ]),
    };
    const listCalendars = await requests.requestCalendars(xhr, 'https://caldav.host.com/home');

    expect(listCalendars).to.eql([
      {
        data: {
          props: {
            calendarDescription: 'Description 1',
            displayname: 'Calendrier 1',
            getctag: 'ctag1',
            resourcetype: 'calendar',
            supportedCalendarComponentSet: ['VEVENT'],
            syncToken: 'sync-token-1',
            timezone: 'Europe/Paris',
          },
          href: '/home/personal',
        },
        description: 'Description 1',
        timezone: undefined,
        url: 'https://caldav.host.com/home/personal',
        ctag: 'ctag1',
        displayName: 'Calendrier 1',
        components: ['VEVENT'],
        resourcetype: 'calendar',
        syncToken: 'sync-token-1',
      },
      {
        data: {
          props: {
            calendarDescription: 'Description 2',
            displayname: 'Calendrier 2',
            getctag: 'ctag22',
            resourcetype: 'calendar',
            supportedCalendarComponentSet: ['VEVENT'],
            syncToken: 'sync-token-22',
            timezone: 'Europe/Paris',
          },
          href: '/home/professional',
        },
        description: 'Description 2',
        timezone: undefined,
        url: 'https://caldav.host.com/home/professional',
        ctag: 'ctag22',
        displayName: 'Calendrier 2',
        components: ['VEVENT'],
        resourcetype: 'calendar',
        syncToken: 'sync-token-22',
      },
      {
        data: {
          props: {
            calendarDescription: 'Description 3',
            displayname: 'Calendrier 3',
            getctag: 'ctag3',
            resourcetype: 'calendar',
            supportedCalendarComponentSet: ['VEVENT'],
            syncToken: 'sync-token-3',
            timezone: 'Europe/Paris',
          },
          href: '/home/avengers',
        },
        description: 'Description 3',
        timezone: undefined,
        url: 'https://caldav.host.com/home/avengers',
        ctag: 'ctag3',
        displayName: 'Calendrier 3',
        components: ['VEVENT'],
        resourcetype: 'calendar',
        syncToken: 'sync-token-3',
      },
    ]);
  });

  it('should request changes', async () => {
    const xhr = {
      send: fake.resolves({
        responses: [
          {
            href: 'https://caldav.host.com/home/personal/event-1.ics',
            props: {
              etag: '91ca3c10-ce36-48dc-9da5-4e25ce575b7e',
            },
          },
          {
            href: 'https://caldav.host.com/home/personal/',
            props: {
              etag: '6e187cb6-3a01-4ae5-9387-8c9ee229fd27',
            },
          },
        ],
      }),
    };

    const listChanges = await requests.requestChanges(xhr, 'https://caldav.host.com/home');

    expect(listChanges).to.eql([
      {
        href: 'https://caldav.host.com/home/personal/event-1.ics',
        props: {
          etag: '91ca3c10-ce36-48dc-9da5-4e25ce575b7e',
        },
      },
      {
        href: 'https://caldav.host.com/home/personal/',
        props: {
          etag: '6e187cb6-3a01-4ae5-9387-8c9ee229fd27',
        },
      },
    ]);
  });

  it('should request events data', async () => {
    const xhr = {
      send: fake.resolves({ request: { responseText: '<xml></xml>' } }),
    };

    const eventsData = await requests.requestEventsData(
      xhr,
      'https://caldav.host.com/home/personal',
      [
        {
          href: 'https://caldav.host.com/home/personal/',
          props: {
            key: 'value',
          },
        },
        {
          href: 'https://caldav.host.com/home/personal/event-1.ics',
          props: {
            key: 'value',
          },
        },
      ],
      'other',
    );

    expect(eventsData).to.eql([
      {
        href: 'https://caldav.host.com/home/personal/event-1.ics',
        type: 'VEVENT',
        uid: '49193db9-f666-4947-8ce6-3357ce3b7166',
        summary: 'Evenement 1',
        start: new Date('2018-06-08T00:00:00.000Z'),
        end: new Date('2018-06-09T00:00:00.000Z'),
      },
    ]);
  });
});
