const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const dayjs = require('dayjs');
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
  let requests;
  before(() => {
    requests = {
      serviceId: '5d6c666f-56be-4929-9104-718a78556844',
      requestCalendars,
      requestChanges,
      requestEventsData,
      dayjs: dayjs.utc,
      dav: {
        ns: namespace,
        request: {
          propfind: sinon.stub(),
          syncCollection: sinon.stub(),
        },
        Request: sinon.stub().returns({ requestDate: 'request3' }),
      },
      ical: {
        parseICS: sinon
          .stub()
          .onFirstCall()
          .returns({
            data: {
              type: 'VEVENT',
              uid: '49193db9-f666-4947-8ce6-3357ce3b7166',
              summary: 'Evenement 1',
              start: new Date('2018-06-08'),
              end: new Date('2018-06-09'),
            },
          })
          .onSecondCall()
          .returns({}),
      },
      xmlDom: {
        DOMParser: sinon.stub().returns({
          parseFromString: sinon.stub().returns({
            getElementsByTagName: sinon.stub().returns([
              {
                tagName: 'response',
                getElementsByTagName: sinon
                  .stub()
                  .onFirstCall()
                  .returns([
                    {
                      tagName: 'calendar-data',
                      childNodes: [
                        {
                          data: `
                    BEGIN:VCALENDAR
                    VERSION:2.0
                    PRODID:+//IDN bitfire.at//DAVdroid/1.11.2-ose ical4j/2.2.0
                    BEGIN:VEVENT
                    DTSTAMP:20180609T234355Z
                    UID:49193db9-f666-4947-8ce6-3357ce3b7166
                    SUMMARY:Evenement 1
                    DESCRIPTION:Description Evenement 1
                    DTSTART;VALUE=DATE:20180608
                    DURATION:P1D
                    STATUS:CONFIRMED
                    BEGIN:VALARM
                    TRIGGER:-PT10M
                    ACTION:DISPLAY
                    DESCRIPTION:Evenement 1
                    END:VALARM
                    END:VEVENT
                    END:VCALENDAR
                    `,
                        },
                      ],
                    },
                  ])
                  .onSecondCall()
                  .returns([
                    { tagName: 'href', childNodes: [{ data: 'https://caldav.host.com/home/personal/event-1.ics' }] },
                  ]),
              },
              {
                tagName: 'response',
                getElementsByTagName: sinon.stub().returns([
                  {
                    tagName: 'calendar-data',
                    childNodes: [
                      {
                        data: '',
                      },
                    ],
                  },
                ]),
              },
            ]),
          }),
        }),
      },
    };
  });

  it('should request calendars', async () => {
    const xhr = {
      send: sinon.stub(),
    };
    xhr.send.resolves([
      {
        props: {
          resourcetype: ['collection', 'calendar'],
          supportedCalendarComponentSet: ['VEVENT'],
          displayname: 'Calendrier 1',
          calendarDescription: 'Description 1',
          calendarColor: '#c4391d',
          timezone: 'Europe/Paris',
          getctag: 'ctag1',
          syncToken: 'sync-token-1',
        },
        href: '/home/personal',
      },
      {
        props: {
          resourcetype: ['collection', 'calendar'],
          supportedCalendarComponentSet: ['VEVENT'],
          displayname: 'Calendrier 2',
          calendarDescription: 'Description 2',
          calendarColor: '#d5282c',
          timezone: 'Europe/Paris',
          getctag: 'ctag22',
          syncToken: 'sync-token-22',
        },
        href: '/home/professional',
      },
      {
        props: {
          resourcetype: ['collection', 'calendar'],
          supportedCalendarComponentSet: ['VEVENT'],
          displayname: 'Calendrier 3',
          calendarDescription: 'Description 3',
          timezone: 'Europe/Paris',
          getctag: 'ctag3',
          syncToken: 'sync-token-3',
        },
        href: '/home/avengers',
      },
    ]);
    const listCalendars = await requests.requestCalendars(xhr, 'https://caldav.host.com/home');

    expect(listCalendars).to.eql([
      {
        data: {
          props: {
            calendarDescription: 'Description 1',
            displayname: 'Calendrier 1',
            calendarColor: '#c4391d',
            getctag: 'ctag1',
            resourcetype: ['collection', 'calendar'],
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
        color: '#c4391d',
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-1',
      },
      {
        data: {
          props: {
            calendarDescription: 'Description 2',
            displayname: 'Calendrier 2',
            calendarColor: '#d5282c',
            getctag: 'ctag22',
            resourcetype: ['collection', 'calendar'],
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
        color: '#d5282c',
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-22',
      },
      {
        data: {
          props: {
            calendarDescription: 'Description 3',
            displayname: 'Calendrier 3',
            getctag: 'ctag3',
            resourcetype: ['collection', 'calendar'],
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
        color: undefined,
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-3',
      },
    ]);
  });

  it('should request changes', async () => {
    const xhr = {
      send: sinon.stub(),
    };
    xhr.send
      .onFirstCall()
      .resolves({
        responses: [
          {
            href: 'https://caldav.host.com/home/personal/event-1.ics',
            props: {
              getetag: '91ca3c10-ce36-48dc-9da5-4e25ce575b7e',
            },
          },
          {
            href: 'https://caldav.host.com/home/personal/',
            props: {
              getetag: '6e187cb6-3a01-4ae5-9387-8c9ee229fd27',
            },
          },
        ],
      })
      .onSecondCall()
      .resolves({
        responses: [
          {
            href: 'https://caldav.host.com/home/personal/event-deleted.ics',
            props: {},
          },
        ],
      })
      .onThirdCall()
      .resolves({
        responses: [],
      });
    const listChanges = await requests.requestChanges(xhr, 'https://caldav.host.com/home');

    expect(listChanges).to.eql([
      {
        href: 'https://caldav.host.com/home/personal/event-1.ics',
        props: {
          getetag: '91ca3c10-ce36-48dc-9da5-4e25ce575b7e',
        },
      },
      {
        href: 'https://caldav.host.com/home/personal/',
        props: {
          getetag: '6e187cb6-3a01-4ae5-9387-8c9ee229fd27',
        },
      },
      {
        href: 'https://caldav.host.com/home/personal/event-deleted.ics',
        props: {},
      },
    ]);
  });

  it('should request events data', async () => {
    const xhr = {
      send: sinon.stub(),
    };
    const setRequestHeader = sinon.stub();
    xhr.send.resolves({ request: { responseText: '<xml></xml>' } });
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

    requests.dav.Request.args[0][0].transformRequest({ setRequestHeader });
    expect(setRequestHeader.args[0]).to.eql(['Content-Type', 'application/xml;charset=utf-8']);

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
