const { expect, assert } = require('chai');

const db = require('../../../models');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_CALENDAR_MANIFEST } = require('./testUtils.test');

const JOHN_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const PEPPER_USER_ID = '7a137a56-069e-4996-8816-36558174b727';

const seedCalendarService = (overrides = {}) =>
  seedExternalService({
    name: 'ext-dev-nextcloud-calendar',
    selector: 'ext-dev-nextcloud-calendar',
    manifest: TEST_CALENDAR_MANIFEST,
    ...overrides,
  });

describe('externalIntegration calendar accounts', () => {
  it('should enable, read, edit and disable the account of a user', async () => {
    const service = await seedCalendarService();
    const { externalIntegration } = buildSupervisor();
    // enable with values
    const view = await externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {
      server_url: 'https://cloud.example.com',
      app_password: 's3cret',
    });
    expect(view.enabled).to.equal(true);
    expect(view.config).to.deep.equal({ server_url: 'https://cloud.example.com', app_password: null });
    expect(view.configured_secrets).to.deep.equal(['app_password']);
    expect(view.calendars).to.deep.equal([]);
    // secret null = unchanged on a later save
    const view2 = await externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {
      server_url: 'https://cloud2.example.com',
      app_password: null,
    });
    expect(view2.config.server_url).to.equal('https://cloud2.example.com');
    expect(view2.configured_secrets).to.deep.equal(['app_password']);
    // the integration reads the accounts with the secrets
    const accounts = await externalIntegration.getCalendarAccounts(service);
    expect(accounts).to.have.lengthOf(1);
    expect(accounts[0].user).to.deep.equal({ selector: 'john', first_name: 'John', language: 'en' });
    expect(accounts[0].config).to.deep.equal({
      server_url: 'https://cloud2.example.com',
      app_password: 's3cret',
    });
    // disable destroys the user's calendars and the account
    await externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [{ external_id: `ext:${service.selector}:john:primary`, name: 'Primary' }],
    });
    const result = await externalIntegration.disableCalendarAccount(service.selector, JOHN_USER_ID);
    expect(result).to.deep.equal({ success: true });
    const calendars = await db.Calendar.findAll({ where: { service_id: service.id } });
    expect(calendars).to.have.lengthOf(0);
    const viewAfter = await externalIntegration.getCalendarAccountForUser(service.selector, JOHN_USER_ID);
    expect(viewAfter.enabled).to.equal(false);
  });

  it('should treat "enabled with zero fields" as a first-class state', async () => {
    const service = await seedCalendarService({
      manifest: { ...TEST_CALENDAR_MANIFEST, account_schema: undefined },
    });
    const { externalIntegration } = buildSupervisor();
    // config omitted entirely
    const view = await externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, undefined);
    expect(view.enabled).to.equal(true);
    expect(view.config).to.deep.equal({});
    // any key on a schema-less integration -> 422
    const promise = externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, { foo: 'bar' });
    await expect(promise).to.be.rejectedWith(Error422);
  });

  it('should validate the account values against the account_schema', async () => {
    const service = await seedCalendarService();
    const { externalIntegration } = buildSupervisor();
    await assert.isRejected(
      externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, 'not-an-object'),
      'config: must be an object',
    );
    await expect(
      externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, { unknown_key: 1 }),
    ).to.be.rejectedWith(Error422);
  });

  it('should answer like an unknown selector on a non-calendar integration', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    await assert.isRejected(
      externalIntegration.getCalendarAccountForUser(service.selector, JOHN_USER_ID),
      'EXTERNAL_INTEGRATION_NOT_FOUND',
    );
    await assert.isRejected(
      externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {}),
      'EXTERNAL_INTEGRATION_NOT_FOUND',
    );
    await assert.isRejected(
      externalIntegration.disableCalendarAccount(service.selector, JOHN_USER_ID),
      'EXTERNAL_INTEGRATION_NOT_FOUND',
    );
    await assert.isRejected(
      externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'x', { sync: false }),
      'EXTERNAL_INTEGRATION_NOT_FOUND',
    );
  });

  it('should notify the integration on account changes, after applying them', async () => {
    const service = await seedCalendarService();
    const { externalIntegration } = buildSupervisor();
    const sent = [];
    externalIntegration.sendMessage = (targetService, type, payload) => {
      sent.push({ type, payload });
      return true;
    };
    await externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {});
    expect(sent).to.deep.include({
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CALENDAR_ACCOUNT_UPDATED,
      payload: { user: 'john' },
    });
  });
});

describe('externalIntegration.updateUserCalendar', () => {
  let service;
  let externalIntegration;
  let event;

  beforeEach(async () => {
    service = await seedCalendarService();
    ({ externalIntegration, event } = buildSupervisor());
    await externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {});
    await externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [{ external_id: `ext:${service.selector}:john:primary`, name: 'Primary' }],
    });
    await externalIntegration.publishCalendarEvents(service, {
      calendar_external_id: `ext:${service.selector}:john:primary`,
      events: [
        {
          external_id: `ext:${service.selector}:john:uid-1`,
          name: 'Dentist',
          start: '2026-08-14T09:00:00.000Z',
        },
      ],
    });
  });

  it('should toggle shared, then empty the events when sync is toggled off', async () => {
    const updated = await externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', {
      shared: true,
    });
    expect(updated).to.deep.include({ selector: 'primary', shared: true, sync: true });
    const afterSyncOff = await externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', {
      sync: false,
    });
    expect(afterSyncOff).to.deep.include({ sync: false });
    const calendar = await db.Calendar.findOne({ where: { selector: 'primary' } });
    const events = await db.CalendarEvent.count({ where: { calendar_id: calendar.id } });
    expect(events).to.equal(0);
    // a push to a sync-disabled calendar is refused
    await assert.isRejected(
      externalIntegration.publishCalendarEvents(service, {
        calendar_external_id: `ext:${service.selector}:john:primary`,
        events: [],
      }),
      'CALENDAR_SYNC_DISABLED',
    );
  });

  it('should refuse other keys and non-boolean values', async () => {
    await assert.isRejected(
      externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', { name: 'x' }),
      'only sync and shared can be updated',
    );
    await assert.isRejected(
      externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', { sync: 'yes' }),
      'sync: must be a boolean',
    );
  });

  it('should answer like an unknown calendar on another user', async () => {
    await assert.isRejected(
      externalIntegration.updateUserCalendar(service.selector, PEPPER_USER_ID, 'primary', { sync: false }),
      'CALENDAR_NOT_FOUND',
    );
  });

  it('should still push to everyone when unsharing a shared calendar', async () => {
    await externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', { shared: true });
    await externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', { shared: false });
    // the previous household viewers must drop the calendar: the unshare
    // itself still goes out as a send-all
    const sendAllCalls = event.emit
      .getCalls()
      .filter((call) => call.args[0] === 'websocket.send-all')
      .filter((call) => call.args[1].type === WEBSOCKET_MESSAGE_TYPES.CALENDAR.UPDATED);
    expect(sendAllCalls.length).to.be.greaterThan(1);
    expect(sendAllCalls[sendAllCalls.length - 1].args[1].payload).to.deep.equal({
      calendar_selectors: ['primary'],
    });
  });

  it('should include the source calendar in the push when an event moves', async () => {
    await externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [{ external_id: `ext:${service.selector}:john:work`, name: 'Work' }],
    });
    await externalIntegration.publishCalendarEvents(service, {
      calendar_external_id: `ext:${service.selector}:john:work`,
      events: [
        {
          external_id: `ext:${service.selector}:john:uid-1`,
          name: 'Dentist',
          start: '2026-08-14T09:00:00.000Z',
        },
      ],
    });
    const sendCalls = event.emit
      .getCalls()
      .filter((call) => call.args[0] === 'websocket.send')
      .filter((call) => call.args[1].type === WEBSOCKET_MESSAGE_TYPES.CALENDAR.UPDATED);
    const lastPayload = sendCalls[sendCalls.length - 1].args[1].payload;
    expect(lastPayload.calendar_selectors.sort()).to.eql(['primary', 'work']);
  });

  it('should push calendar.updated to everyone when the calendar is shared', async () => {
    await externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', { shared: true });
    const sendAllCalls = event.emit
      .getCalls()
      .filter((call) => call.args[0] === 'websocket.send-all')
      .filter((call) => call.args[1].type === WEBSOCKET_MESSAGE_TYPES.CALENDAR.UPDATED);
    expect(sendAllCalls.length).to.be.greaterThan(0);
    expect(sendAllCalls[sendAllCalls.length - 1].args[1].payload).to.deep.equal({
      calendar_selectors: ['primary'],
    });
  });
});

describe('externalIntegration calendar host API guards', () => {
  let service;
  let externalIntegration;
  let event;

  beforeEach(async () => {
    service = await seedCalendarService();
    ({ externalIntegration, event } = buildSupervisor());
    await externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {});
    await externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [{ external_id: `ext:${service.selector}:john:primary`, name: 'Primary' }],
    });
  });

  it('should reject a non-string user filter on the calendar listing', async () => {
    // ?user[]=a&user[]=b and ?user[x]=y reach the handler as an array and an
    // object: they must never become a Sequelize where value
    await assert.isRejected(
      externalIntegration.getIntegrationCalendars(service, ['john', 'pepper']),
      'user: must be a non-empty string',
    );
    await assert.isRejected(
      externalIntegration.getIntegrationCalendars(service, { selector: 'john' }),
      'user: must be a non-empty string',
    );
    // the filter stays optional, and a plain selector still works
    const all = await externalIntegration.getIntegrationCalendars(service);
    expect(all.map((calendar) => calendar.selector)).to.eql(['primary']);
    const filtered = await externalIntegration.getIntegrationCalendars(service, 'john');
    expect(filtered.map((calendar) => calendar.selector)).to.eql(['primary']);
  });

  it('should reject the out-of-bounds and duplicate fields of a published batch', async () => {
    const prefix = `ext:${service.selector}:john:`;
    const publish = (events) =>
      externalIntegration.publishCalendarEvents(service, {
        calendar_external_id: `${prefix}primary`,
        events,
      });
    const validEvent = (overrides) => ({
      external_id: `${prefix}uid-1`,
      name: 'Dentist',
      start: '2026-08-14T09:00:00.000Z',
      ...overrides,
    });
    await assert.isRejected(publish([validEvent({ location: 'x'.repeat(1000) })]), 'events[0].location');
    await assert.isRejected(publish([validEvent({ description: 'x'.repeat(20000) })]), 'events[0].description');
    await assert.isRejected(publish([validEvent({ url: 'ftp://example.com' })]), 'events[0].url');
    await assert.isRejected(
      publish([validEvent({}), validEvent({ name: 'Twin' })]),
      'events[1].external_id: duplicate in the batch',
    );
    await assert.isRejected(
      externalIntegration.publishCalendarEvents(service, {
        calendar_external_id: `${prefix}primary`,
        events: [],
        window: { from: '2026-09-01T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z' },
      }),
      'window: from must be before to',
    );
    await assert.isRejected(
      externalIntegration.publishCalendarEvents(service, {
        calendar_external_id: `${prefix}primary`,
        events: [],
        window: ['2026-08-01T00:00:00.000Z'],
      }),
      'window: must be an object',
    );
  });

  it('should reject the out-of-bounds fields of a published calendar batch', async () => {
    const prefix = `ext:${service.selector}:john:`;
    const publish = (calendars) => externalIntegration.publishCalendars(service, { user: 'john', calendars });
    await assert.isRejected(
      publish([{ external_id: `${prefix}other`, name: 'Other', description: 'x'.repeat(20000) }]),
      'calendars[0].description',
    );
    await assert.isRejected(
      publish([
        { external_id: `${prefix}dup`, name: 'One' },
        { external_id: `${prefix}dup`, name: 'Two' },
      ]),
      'calendars[1].external_id: duplicate in the batch',
    );
    // an invalid color never rejects a calendar: it falls back to the default
    const { created } = await publish([{ external_id: `${prefix}colored`, name: 'Colored', color: 'not-a-color' }]);
    expect(created).to.equal(1);
    const row = await db.Calendar.findOne({ where: { external_id: `${prefix}colored` } });
    expect(row.color).to.equal('#3174ad');
  });

  it('should keep the private calendars of a disabled account out of the broadcast', async () => {
    const prefix = `ext:${service.selector}:john:`;
    await externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [
        { external_id: `${prefix}primary`, name: 'Primary' },
        { external_id: `${prefix}secret`, name: 'Secret' },
      ],
    });
    await externalIntegration.updateUserCalendar(service.selector, JOHN_USER_ID, 'primary', { shared: true });
    event.emit.resetHistory();
    await externalIntegration.disableCalendarAccount(service.selector, JOHN_USER_ID);
    const updatedCalls = (channel) =>
      event.emit
        .getCalls()
        .filter((call) => call.args[0] === channel)
        .filter((call) => call.args[1].type === WEBSOCKET_MESSAGE_TYPES.CALENDAR.UPDATED);
    // the shared one goes to everyone, the private one only to its owner
    const sendAllCalls = updatedCalls('websocket.send-all');
    expect(sendAllCalls).to.have.lengthOf(1);
    expect(sendAllCalls[0].args[1].payload).to.deep.equal({ calendar_selectors: ['primary'] });
    const sendCalls = updatedCalls('websocket.send');
    expect(sendCalls).to.have.lengthOf(1);
    expect(sendCalls[0].args[1].payload).to.deep.equal({ calendar_selectors: ['secret'] });
    expect(sendCalls[0].args[1].userId).to.equal(JOHN_USER_ID);
  });

  it('should broadcast nothing when every deleted calendar is private', async () => {
    event.emit.resetHistory();
    await externalIntegration.disableCalendarAccount(service.selector, JOHN_USER_ID);
    const sendAllCalls = event.emit
      .getCalls()
      .filter((call) => call.args[0] === 'websocket.send-all')
      .filter((call) => call.args[1].type === WEBSOCKET_MESSAGE_TYPES.CALENDAR.UPDATED);
    expect(sendAllCalls).to.have.lengthOf(0);
  });
});

describe('externalIntegration calendar host API coverage', () => {
  let service;
  let externalIntegration;
  let variable;
  const prefix = () => `ext:${service.selector}:john:`;

  beforeEach(async () => {
    service = await seedCalendarService();
    ({ externalIntegration, variable } = buildSupervisor());
    await externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {});
  });

  it('should store every optional field of a fully specified batch', async () => {
    const { created } = await externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [
        {
          external_id: `${prefix()}primary`,
          name: 'Primary',
          description: 'My main calendar',
          color: '#AABBCC',
        },
      ],
    });
    expect(created).to.equal(1);
    const calendarRow = await db.Calendar.findOne({ where: { external_id: `${prefix()}primary` } });
    expect(calendarRow.description).to.equal('My main calendar');
    expect(calendarRow.color).to.equal('#aabbcc');
    const result = await externalIntegration.publishCalendarEvents(service, {
      calendar_external_id: `${prefix()}primary`,
      window: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
      events: [
        {
          external_id: `${prefix()}uid-1`,
          name: 'Dentist',
          start: '2026-08-14T09:00:00.000Z',
          end: '2026-08-14T09:30:00.000Z',
          full_day: false,
          location: 'Paris',
          description: 'Yearly check',
          url: 'https://example.com/event',
        },
        // no end: membership falls back to start >= from
        { external_id: `${prefix()}uid-2`, name: 'Standup', start: '2026-08-15T08:00:00.000Z', full_day: true },
      ],
    });
    expect(result).to.deep.equal({ success: true, created: 2, updated: 0, deleted: 0 });
    const eventRow = await db.CalendarEvent.findOne({ where: { external_id: `${prefix()}uid-1` } });
    expect(eventRow.location).to.equal('Paris');
    expect(eventRow.description).to.equal('Yearly check');
    expect(eventRow.url).to.equal('https://example.com/event');
    expect(eventRow.full_day).to.equal(false);
  });

  it('should reject the malformed entries of a published event batch', async () => {
    await externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [{ external_id: `${prefix()}primary`, name: 'Primary' }],
    });
    const publish = (body) => externalIntegration.publishCalendarEvents(service, body);
    const base = { calendar_external_id: `${prefix()}primary` };
    await assert.isRejected(publish({ events: [] }), 'calendar_external_id: must be a non-empty string');
    await assert.isRejected(publish({ ...base, events: 'nope' }), 'events: must be an array');
    await assert.isRejected(
      publish({ ...base, events: new Array(501).fill({}) }),
      'events: max 500 events per request',
    );
    await assert.isRejected(publish({ calendar_external_id: `${prefix()}unknown`, events: [] }), 'CALENDAR_NOT_FOUND');
    await assert.isRejected(publish({ ...base, events: [null] }), 'events[0]: must be an object');
    await assert.isRejected(
      publish({ ...base, events: [{ external_id: 'not-prefixed', name: 'x', start: '2026-08-14T09:00:00.000Z' }] }),
      'events[0].external_id: must start with',
    );
    const valid = { external_id: `${prefix()}uid-1`, name: 'Dentist', start: '2026-08-14T09:00:00.000Z' };
    await assert.isRejected(publish({ ...base, events: [{ ...valid, name: '' }] }), 'events[0].name');
    await assert.isRejected(publish({ ...base, events: [{ ...valid, start: 'yesterday' }] }), 'events[0].start');
    await assert.isRejected(
      publish({ ...base, events: [{ ...valid, end: '2026-08-13T09:00:00.000Z' }] }),
      'events[0].end: must not be before start',
    );
    await assert.isRejected(
      publish({ ...base, events: [{ ...valid, full_day: 'yes' }] }),
      'events[0].full_day: must be a boolean',
    );
    await assert.isRejected(
      publish({ ...base, events: [{ ...valid, end: 'never' }] }),
      'events[0].end: must be an ISO 8601 date',
    );
    await assert.isRejected(
      publish({
        ...base,
        events: [valid],
        window: { from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' },
      }),
      'events[0]: must overlap the window',
    );
    await assert.isRejected(
      publish({
        ...base,
        events: [{ ...valid, end: '2026-08-14T09:30:00.000Z' }],
        window: { from: '2026-09-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' },
      }),
      'events[0]: must overlap the window',
    );
  });

  it('should reject the malformed entries of a published calendar batch', async () => {
    const publish = (body) => externalIntegration.publishCalendars(service, body);
    await assert.isRejected(publish({ calendars: [] }), 'user: must be a non-empty string');
    await assert.isRejected(publish({ user: 'john', calendars: 'nope' }), 'calendars: must be an array');
    // an unknown user and a user who did not enable the integration answer the same
    await assert.isRejected(publish({ user: 'does-not-exist', calendars: [] }), 'CALENDAR_ACCOUNT_NOT_FOUND');
    await assert.isRejected(publish({ user: 'pepper', calendars: [] }), 'CALENDAR_ACCOUNT_NOT_FOUND');
    await assert.isRejected(publish({ user: 'john', calendars: [null] }), 'calendars[0]: must be an object');
    await assert.isRejected(
      publish({ user: 'john', calendars: [{ external_id: 'not-prefixed', name: 'x' }] }),
      'calendars[0].external_id: must start with',
    );
    await assert.isRejected(
      publish({ user: 'john', calendars: [{ external_id: `${prefix()}primary`, name: '' }] }),
      'calendars[0].name',
    );
    const tooMany = new Array(51).fill(null).map((ignored, index) => ({
      external_id: `${prefix()}cal-${index}`,
      name: `Calendar ${index}`,
    }));
    await assert.isRejected(
      publish({ user: 'john', calendars: tooMany }),
      'calendars: a user cannot hold more than 50 calendars',
    );
  });

  it('should reject a deletion without external_id and skip the notification of an unknown user', async () => {
    await assert.isRejected(
      externalIntegration.deleteIntegrationCalendar(service, undefined),
      'external_id: must be a non-empty string',
    );
    // a user destroyed between the write and the notification: nothing to send
    const sent = [];
    externalIntegration.sendMessage = (targetService, type, payload) => sent.push({ type, payload });
    await externalIntegration.notifyCalendarAccountUpdated(service, '4b8a0c1e-9f4a-4a4c-8b1e-3a2f6d5c7e90');
    expect(sent).to.have.lengthOf(0);
  });

  it('should answer 403 on the calendar host API of a non-calendar integration', async () => {
    const deviceService = await seedExternalService();
    const { externalIntegration: supervisor } = buildSupervisor();
    await assert.isRejected(supervisor.getCalendarAccounts(deviceService), 'CALENDAR_NOT_ALLOWED');
    await assert.isRejected(supervisor.getIntegrationCalendars(deviceService), 'CALENDAR_NOT_ALLOWED');
    await assert.isRejected(supervisor.publishCalendars(deviceService, {}), 'CALENDAR_NOT_ALLOWED');
    await assert.isRejected(supervisor.publishCalendarEvents(deviceService, {}), 'CALENDAR_NOT_ALLOWED');
    await assert.isRejected(supervisor.deleteIntegrationCalendar(deviceService, 'x'), 'CALENDAR_NOT_ALLOWED');
  });

  it('should fall back to an empty config on a corrupted stored account', async () => {
    // the raw value is never valid JSON here: both readers must degrade
    // gracefully, and neither may log the value itself (it carries secrets)
    await variable.setValue('EXTERNAL_INTEGRATION_CALENDAR_ACCOUNT', '{not json', service.id, JOHN_USER_ID);
    const view = await externalIntegration.getCalendarAccountForUser(service.selector, JOHN_USER_ID);
    expect(view.enabled).to.equal(true);
    expect(view.config).to.deep.equal({ server_url: null, app_password: null });
    expect(view.configured_secrets).to.deep.equal([]);
    const accounts = await externalIntegration.getCalendarAccounts(service);
    expect(accounts).to.have.lengthOf(1);
    expect(accounts[0].config).to.deep.equal({});
  });

  it('should skip the section fields of the account schema and the orphan variables', async () => {
    const sectionService = await seedCalendarService({
      name: 'ext-dev-gcal',
      selector: 'ext-dev-gcal',
      manifest: {
        ...TEST_CALENDAR_MANIFEST,
        account_schema: [
          { key: 'credentials', type: 'section', label: { en: 'Credentials' } },
          { key: 'server_url', type: 'string', label: { en: 'Server URL' } },
        ],
      },
    });
    const view = await externalIntegration.saveCalendarAccount(sectionService.selector, JOHN_USER_ID, {
      server_url: 'https://cloud.example.com',
    });
    // a section is a layout marker, never a stored value
    expect(view.config).to.deep.equal({ server_url: 'https://cloud.example.com' });
    // a service-scoped variable without a user is not an account
    await variable.setValue('EXTERNAL_INTEGRATION_CALENDAR_ACCOUNT', '{}', sectionService.id);
    const accounts = await externalIntegration.getCalendarAccounts(sectionService);
    expect(accounts).to.have.lengthOf(1);
    expect(accounts[0].user.selector).to.equal('john');
  });
});
