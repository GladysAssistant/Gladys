const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const moment = require('moment');
const { syncUserCalendars } = require('../../../../../services/caldav/lib/calendar/calendar.syncUserCalendars');
const { formatCalendars, formatEvents } = require('../../../../../services/caldav/lib/calendar/calendar.formaters');

chai.use(chaiAsPromised);
const { expect } = chai;

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';
const serviceId = '5d6c666f-56be-4929-9104-718a78556844';

const namespace = {
  CALENDAR_SERVER: 'http://calendarserver.org/ns/',
  CALDAV_APPLE: 'http://apple.com/ns/ical/',
  CALDAV: 'urn:ietf:params:xml:ns:caldav',
  CARDDAV: 'urn:ietf:params:xml:ns:carddav',
  DAV: 'DAV:',
};

const calendars = [
  { url: 'https://caldav.tonystark.com/perso' },
  { url: 'https://caldav.tonystark.com/stark-industries' },
  { url: 'https://caldav.tonystark.com/avengers' },
];

describe('CalDAV sync', () => {
  const send = sinon.stub();
  const sync = {
    serviceId,
    syncUserCalendars,
    connect: sinon.stub().resolves({ calendars }),
    formatCalendars,
    formatEvents,
    gladys: {
      calendar: {
        create: sinon.stub(),
        createEvent: sinon.stub(),
        get: sinon.stub(),
        destroy: sinon.stub().resolves(),
        getEvents: sinon.stub(),
        destroyEvent: sinon.stub().resolves(),
      },
      variable: {
        getValue: sinon.stub(),
      },
    },
    moment,
    dav: {
      ns: namespace,
      transport: {
        Basic: sinon.stub().returns({
          send,
        }),
      },
      Credentials: sinon.stub(),
      request: {
        propfind: sinon.stub(),
        syncCollection: sinon.stub(),
      },
      Request: sinon.stub().returns({ requestDate: 'request3' }),
    },
    ical: {
      parseICS: sinon.stub().returns({
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
      DOMParser: sinon.stub().returns({
        parseFromString: sinon.stub().returns({
          getElementsByTagName: sinon.stub().returns([
            {
              getElementsByTagName: sinon
                .stub()
                .onFirstCall()
                .returns([
                  {
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
                .returns([{ childNodes: [{ data: 'https://caldav.host.com/home/personal/event-1.ics' }] }]),
            },
          ]),
        }),
      }),
    },
  };

  it('should start sync', async () => {
    sync.gladys.variable.getValue
      .withArgs('CALDAV_HOST', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('other');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_HOME_URL', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('https://caldav.host.com/home');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');

    sync.dav.request.propfind
      .withArgs({
        props: [
          { name: 'calendar-description', namespace: sync.dav.ns.CALDAV },
          { name: 'calendar-timezone', namespace: sync.dav.ns.CALDAV },
          { name: 'displayname', namespace: sync.dav.ns.DAV },
          { name: 'getctag', namespace: sync.dav.ns.CALENDAR_SERVER },
          { name: 'resourcetype', namespace: sync.dav.ns.DAV },
          { name: 'supported-calendar-component-set', namespace: sync.dav.ns.CALDAV },
          { name: 'sync-token', namespace: sync.dav.ns.DAV },
        ],
        depth: 1,
      })
      .returns('request1');

    send
      .withArgs('request1', 'https://caldav.host.com/home')
      .resolves([
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
      ])
      .withArgs('request-collection', 'https://caldav.host.com/home/personal')
      .resolves({
        responses: [
          {
            href: 'https://caldav.host.com/home/personal/event-1.ics',
            props: {
              etag: '91ca3c10-ce36-48dc-9da5-4e25ce575b7e',
            },
          },
        ],
      })
      .withArgs({ requestDate: 'request3' }, 'https://caldav.host.com/home/personal')
      .resolves({ request: { responseText: '<xml></xml>' } });

    sync.gladys.calendar.get.withArgs(userId, { externalId: 'https://caldav.host.com/home/personal' }).resolves([]);

    sync.gladys.calendar.create.onFirstCall().resolves({
      dataValues: {
        id: '402dd55b-6e06-4a7c-8164-ba3e4641c71b',
        user_id: userId,
        service_id: serviceId,
        name: 'Calendrier 1',
        selector: 'calendrier-1',
        external_id: 'https://caldav.host.com/home/personal',
        description: 'Description 1',
        ctag: 'ctag1',
        sync_token: 'sync-token-1',
        sync: '1',
        notify: '0',
        created_at: '2020-02-11 21:04:51.318 +00:00',
        updated_at: '2020-02-11 21:04:51.318 +00:00',
      },
    });

    sync.dav.request.syncCollection
      .withArgs({
        syncLevel: 1,
        syncToken: '',
        props: [{ name: 'getetag', namespace: sync.dav.ns.DAV }],
      })
      .returns('request-collection');

    sync.gladys.calendar.getEvents.withArgs(userId, { selector: 'evenement-1-2018-06-08' }).resolves([]);

    sync.gladys.calendar.createEvent.resolves({
      dataValues: {
        id: '22396073-3fe6-49a6-bcd7-566281862b02',
        calendar_id: '402dd55b-6e06-4a7c-8164-ba3e4641c71b',
        name: 'Evenement 1',
        selector: 'evenement-1-2018-06-08',
        external_id: '49193db9-f666-4947-8ce6-3357ce3b7166',
        location: null,
        start: '2018-06-08 00:00:00.000 +00:00',
        end: '2018-06-09 00:00:00.000 +00:00',
        url: 'https://caldav.host.com/home/personal/event-1.ics',
        full_day: '1',
        created_at: '2020-02-11 21:04:56.090 +00:00',
        updated_at: '2020-02-11 21:04:56.090 +00:00',
      },
    });

    await sync.syncUserCalendars(userId);

    expect(send.callCount).to.equal(3);
  });
});
