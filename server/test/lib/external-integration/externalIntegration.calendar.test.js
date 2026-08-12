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
