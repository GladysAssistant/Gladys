const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const { syncUserCalendars } = require('../../../../../services/caldav/lib/calendar/calendar.syncUserCalendars');
const { formatCalendars, formatEvents } = require('../../../../../services/caldav/lib/calendar/calendar.formaters');

dayjs.extend(timezone);

chai.use(chaiAsPromised);
const { expect } = chai;

const userId = 'f2e704c9-4c79-41b3-a5bf-914dd1a16127';
const serviceId = '5d6c666f-56be-4929-9104-718a78556844';

describe('CalDAV sync', () => {
  let sync;
  before(() => {
    sync = {
      serviceId,
      syncUserCalendars,
      formatCalendars,
      formatEvents,
      requestCalendars: sinon.stub(),
      requestChanges: sinon.stub(),
      requestEventsData: sinon.stub(),
      gladys: {
        calendar: {
          create: sinon.stub(),
          createEvent: sinon.stub(),
          updateEvent: sinon.stub(),
          get: sinon.stub(),
          update: sinon.stub().resolves(),
          getEvents: sinon.stub(),
          destroyEvent: sinon
            .stub()
            .withArgs('event-to-delete')
            .resolves(),
        },
        variable: {
          getValue: sinon.stub(),
        },
      },
      dayjs,
      dav: {
        transport: {
          Basic: sinon.stub(),
        },
        Credentials: sinon.stub(),
      },
    };
  });

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

    sync.requestCalendars.resolves([
      {
        data: {},
        description: 'Description 1',
        timezone: 'Europe/Paris',
        url: 'https://caldav.host.com/home/personal',
        ctag: 'ctag1',
        displayName: 'Calendrier 1',
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-1',
      },
      {
        data: {},
        description: 'Description 2',
        timezone: 'Europe/Paris',
        url: 'https://caldav.host.com/home/professional',
        ctag: 'ctag22',
        displayName: 'Calendrier 2',
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-22',
      },
      {
        data: {},
        description: 'Description 3',
        timezone: 'Europe/Paris',
        url: 'https://caldav.host.com/home/avengers',
        ctag: 'ctag3',
        displayName: 'Calendrier 3',
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-3',
      },
    ]);

    sync.gladys.calendar.get
      .withArgs(userId, { externalId: 'https://caldav.host.com/home/personal' })
      .resolves([])
      .withArgs(userId, { externalId: 'https://caldav.host.com/home/professional' })
      .resolves([
        {
          sync: '1',
          ctag: 'ctag21',
          sync_token: 'syncToken21',
          external_id: 'https://caldav.host.com/home/professional',
          type: 'CALDAV',
        },
      ])
      .withArgs(userId, { externalId: 'https://caldav.host.com/home/avengers' })
      .resolves([{ ctag: 'ctag3' }]);

    sync.gladys.calendar.create.onFirstCall().resolves({
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
      type: 'CALDAV',
      created_at: '2020-02-11 21:04:51.318 +00:00',
      updated_at: '2020-02-11 21:04:51.318 +00:00',
    });

    sync.requestChanges
      .onFirstCall()
      .resolves([
        {
          href: '/home/personal/event-1.ics',
          props: {
            etag: '91ca3c10-ce36-48dc-9da5-4e25ce575b7e',
          },
        },
        {
          href: '/home/personal/',
          props: {
            etag: '6e187cb6-3a01-4ae5-9387-8c9ee229fd27',
          },
        },
      ])
      .onSecondCall()
      .resolves([
        {
          href: '/home/professional/event-3.ics',
          props: {},
        },
      ]);

    sync.requestEventsData.resolves([
      {
        type: 'VEVENT',
        uid: '49193db9-f666-4947-8ce6-3357ce3b7166',
        summary: 'Evenement 1',
        start: new Date('2018-06-08 00:00:00.000 +00:00'),
        location: null,
      },
      {
        type: 'VEVENT',
        uid: '49193db9-f666-4947-8ce6-3357ce3b7166',
        summary: 'Evenement 1 duplicate to test errors',
        start: new Date('2018-06-08 00:00:00.000 +00:00'),
        location: null,
      },
      {
        type: 'VEVENT',
        uid: '9daca4e5-80dc-4b3e-8b15-a26e19e35ea5',
        summary: 'Evenement 3 to update',
        start: new Date('2018-06-08 00:00:00.000 +00:00'),
        location: null,
      },
    ]);

    sync.gladys.calendar.getEvents
      .withArgs(userId, { externalId: '49193db9-f666-4947-8ce6-3357ce3b7166' })
      .resolves([])
      .withArgs(userId, { externalId: '9daca4e5-80dc-4b3e-8b15-a26e19e35ea5' })
      .resolves([
        {
          selector: '9daca4e5-80dc-4b3e-8b15-a26e19e35ea5',
          external_id: '9daca4e5-80dc-4b3e-8b15-a26e19e35ea5',
          name: 'Evenement 3 to update',
        },
      ])
      .withArgs(userId, { url: '/home/professional/event-3.ics' })
      .resolves([
        {
          selector: 'event-to-delete',
        },
      ]);

    sync.gladys.calendar.createEvent
      .onFirstCall()
      .resolves({
        dataValues: {
          id: '22396073-3fe6-49a6-bcd7-566281862b02',
          calendar_id: '402dd55b-6e06-4a7c-8164-ba3e4641c71b',
          name: 'Evenement 1',
          selector: 'evenement-1-2018-06-08',
          external_id: '49193db9-f666-4947-8ce6-3357ce3b7166',
          location: null,
          start: '2018-06-08 00:00:00.000 +00:00',
          end: '2018-06-09 00:00:00.000 +00:00',
          url: '/home/personal/event-1.ics',
          full_day: '1',
          created_at: '2020-02-11 21:04:56.090 +00:00',
          updated_at: '2020-02-11 21:04:56.090 +00:00',
        },
      })
      .onSecondCall()
      .rejects('ALREADY_EXIST');

    sync.gladys.calendar.updateEvent.onFirstCall().resolves({
      id: '078149ff-50f4-4f48-b2da-03dc06af0835',
      calendar_id: '402dd55b-6e06-4a7c-8164-ba3e4641c71b',
      selector: '9daca4e5-80dc-4b3e-8b15-a26e19e35ea5',
      external_id: '9daca4e5-80dc-4b3e-8b15-a26e19e35ea5',
      name: 'Evenement 3 to update',
      location: null,
      start: '2018-06-08 00:00:00.000 +00:00',
      end: '2018-06-09 00:00:00.000 +00:00',
      url: '/home/personal/event-1.ics',
      full_day: '1',
      created_at: '2020-02-11 21:04:56.090 +00:00',
      updated_at: '2020-02-11 21:04:56.090 +00:00',
    });

    await sync.syncUserCalendars(userId);

    expect(sync.gladys.variable.getValue.callCount).to.equal(4);

    expect(sync.requestCalendars.callCount).to.equal(1);
    expect(sync.requestChanges.callCount).to.equal(2);
    expect(sync.requestEventsData.callCount).to.equal(1);

    expect(sync.gladys.calendar.create.callCount).to.equal(1);
    expect(sync.gladys.calendar.createEvent.callCount).to.equal(2);
    expect(sync.gladys.calendar.get.callCount).to.equal(3);
    expect(sync.gladys.calendar.update.callCount).to.equal(1);
    expect(sync.gladys.calendar.getEvents.callCount).to.equal(4);
    expect(sync.gladys.calendar.destroyEvent.callCount).to.equal(1);
  });

  it('should failed if no CALDAV_HOST', async () => {
    sync.gladys.variable.getValue
      .withArgs('CALDAV_HOST', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns(undefined);
    sync.gladys.variable.getValue
      .withArgs('CALDAV_HOME_URL', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('https://caldav.host.com/home');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');

    await expect(sync.syncUserCalendars(userId)).to.be.rejectedWith(Error, 'CALDAV_NOT_CONFIGURED');
  });

  it('should failed fetch calendars', async () => {
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

    sync.requestCalendars.rejects();

    await expect(sync.syncUserCalendars(userId)).to.be.rejectedWith(Error, 'CALDAV_FAILED_REQUEST_CALENDARS');
  });

  it('should failed fetch changes', async () => {
    sync.gladys.variable.getValue
      .withArgs('CALDAV_HOST', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('othertest');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_HOME_URL', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('https://caldav.host.com/home');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_USERNAME', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('tony');
    sync.gladys.variable.getValue
      .withArgs('CALDAV_PASSWORD', '5d6c666f-56be-4929-9104-718a78556844', userId)
      .returns('12345');

    sync.requestCalendars.resolves([
      {
        data: {},
        description: 'Description 1',
        timezone: 'Europe/Paris',
        url: 'https://caldav.host.com/home/personal',
        ctag: 'ctag1',
        displayName: 'Calendrier 1',
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-1',
      },
    ]);

    sync.gladys.calendar.get.withArgs(userId, { externalId: 'https://caldav.host.com/home/personal' }).resolves([]);

    sync.gladys.calendar.create.resolves({
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
      type: 'CALDAV',
      created_at: '2020-02-11 21:04:51.318 +00:00',
      updated_at: '2020-02-11 21:04:51.318 +00:00',
    });

    sync.requestChanges.rejects();

    await expect(sync.syncUserCalendars(userId)).to.be.rejectedWith(Error, 'CALDAV_FAILED_REQUEST_CHANGES');
  });

  it('should failed get events data', async () => {
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

    sync.requestCalendars.resolves([
      {
        data: {},
        description: 'Description 1',
        timezone: 'Europe/Paris',
        url: 'https://caldav.host.com/home/personal',
        ctag: 'ctag1',
        displayName: 'Calendrier 1',
        components: ['VEVENT'],
        type: 'CALDAV',
        syncToken: 'sync-token-1',
      },
    ]);

    sync.gladys.calendar.get.withArgs(userId, { externalId: 'https://caldav.host.com/home/personal' }).resolves([]);

    sync.gladys.calendar.create.resolves({
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
      type: 'CALDAV',
      created_at: '2020-02-11 21:04:51.318 +00:00',
      updated_at: '2020-02-11 21:04:51.318 +00:00',
    });

    sync.requestChanges.resolves([
      {
        href: '/home/personal/event-1.ics',
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

    sync.requestEventsData.rejects();

    await expect(sync.syncUserCalendars(userId)).to.be.rejectedWith(Error, 'CALDAV_FAILED_REQUEST_EVENTS');
  });
});
