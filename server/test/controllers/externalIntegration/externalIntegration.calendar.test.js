const { expect } = require('chai');

const db = require('../../../models');
const { USER_ROLE } = require('../../../utils/constants');
const { authenticatedRequest, nonAdminRequest, NON_ADMIN_USER_ID } = require('../request.test');

const CALENDAR_MANIFEST = {
  manifest_version: 1,
  type: 'calendar',
  name: 'Nextcloud Calendar',
  description: { en: 'Nextcloud calendar provider demo integration.' },
  version: '1.0.0',
  docker_image: 'ghcr.io/john/gladys-nextcloud-calendar:1.0.0',
  gladys_version: '>=0.1.0',
  account_schema: [
    { key: 'server_url', type: 'string', label: { en: 'Server URL' } },
    { key: 'app_password', type: 'secret', label: { en: 'App password' } },
  ],
};

const seedService = async (overrides = {}) =>
  (
    await db.Service.create({
      name: 'ext-dev-nextcloud-calendar',
      selector: 'ext-dev-nextcloud-calendar',
      version: '1.0.0',
      status: 'RUNNING',
      type: 'external',
      docker_image: CALENDAR_MANIFEST.docker_image,
      manifest: CALENDAR_MANIFEST,
      token_version: 1,
      ...overrides,
    })
  ).get({ plain: true });

const seedNonAdminUser = () =>
  db.User.create({
    id: NON_ADMIN_USER_ID,
    firstname: 'Pepper',
    lastname: 'Potts',
    selector: 'pepper-habitant',
    email: 'pepper-habitant@pots.com',
    password: 'mysuperpassword',
    role: USER_ROLE.HABITANT,
    language: 'en',
    birthdate: '1990-12-12',
  });

describe('External integration management API: my calendars', () => {
  beforeEach(async () => {
    await seedService();
  });

  it('should enable the account, save values, list and toggle the calendars', async () => {
    // enable + values
    const enableRes = await authenticatedRequest
      .post('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .send({ config: { server_url: 'https://cloud.example.com', app_password: 's3cret' } })
      .expect('Content-Type', /json/)
      .expect(200);
    expect(enableRes.body.enabled).to.equal(true);
    expect(enableRes.body.config).to.deep.equal({ server_url: 'https://cloud.example.com', app_password: null });
    expect(enableRes.body.configured_secrets).to.deep.equal(['app_password']);

    // the integration pushes a calendar (in-process shortcut)
    const gladys = global.TEST_GLADYS_INSTANCE;
    const service = await gladys.externalIntegration.getBySelector('ext-dev-nextcloud-calendar');
    await gladys.externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [{ external_id: 'ext:ext-dev-nextcloud-calendar:john:primary', name: 'Primary' }],
    });
    gladys.externalIntegration.calendarWriteRateLimits.clear();

    // read the view back
    const viewRes = await authenticatedRequest
      .get('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .expect(200);
    expect(viewRes.body.calendars).to.have.lengthOf(1);
    expect(viewRes.body.calendars[0]).to.deep.include({ selector: 'primary', sync: true, shared: false });

    // toggle sync off
    const patchRes = await authenticatedRequest
      .patch('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/primary')
      .send({ sync: false })
      .expect(200);
    expect(patchRes.body).to.deep.include({ selector: 'primary', sync: false });

    // disable destroys the calendars
    await authenticatedRequest
      .delete('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .expect(200);
    const afterRes = await authenticatedRequest
      .get('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .expect(200);
    expect(afterRes.body.enabled).to.equal(false);
    expect(afterRes.body.calendars).to.deep.equal([]);
  });

  it('should validate the account values (422) and the toggles (400)', async () => {
    await authenticatedRequest
      .post('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .send({ config: { unknown_key: 1 } })
      .expect(422);
    await authenticatedRequest
      .post('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .send({ config: {} })
      .expect(200);
    await authenticatedRequest
      .patch('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/unknown-calendar')
      .send({ name: 'nope' })
      .expect(400);
    await authenticatedRequest
      .patch('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/unknown-calendar')
      .send({ sync: false })
      .expect(404);
  });

  it('should let a non-admin see the integration and manage their own account only', async () => {
    await seedNonAdminUser();
    // the calendar integration appears in the non-admin list, reduced view
    const listRes = await nonAdminRequest.get('/api/v1/external_integration').expect(200);
    expect(listRes.body).to.have.lengthOf(1);
    expect(listRes.body[0]).to.have.property('selector', 'ext-dev-nextcloud-calendar');
    expect(listRes.body[0]).to.not.have.property('docker_image');

    // they enable their own account
    await nonAdminRequest
      .post('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .send({ config: {} })
      .expect(200);

    // the integration pushes a calendar for each of the two users
    const gladys = global.TEST_GLADYS_INSTANCE;
    const service = await gladys.externalIntegration.getBySelector('ext-dev-nextcloud-calendar');
    await gladys.externalIntegration.saveCalendarAccount(
      'ext-dev-nextcloud-calendar',
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      {},
    );
    await gladys.externalIntegration.publishCalendars(service, {
      user: 'john',
      calendars: [{ external_id: 'ext:ext-dev-nextcloud-calendar:john:primary', name: 'Primary' }],
    });
    await gladys.externalIntegration.publishCalendars(service, {
      user: 'pepper-habitant',
      calendars: [{ external_id: 'ext:ext-dev-nextcloud-calendar:pepper-habitant:primary', name: 'Primary' }],
    });
    gladys.externalIntegration.calendarWriteRateLimits.clear();

    // each user only sees their own calendars
    const viewRes = await nonAdminRequest
      .get('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/account')
      .expect(200);
    expect(viewRes.body.calendars).to.have.lengthOf(1);
    expect(viewRes.body.calendars[0].selector).to.equal('primary-2');

    // and cannot toggle another user's calendar
    await nonAdminRequest
      .patch('/api/v1/external_integration/ext-dev-nextcloud-calendar/calendar/primary')
      .send({ sync: false })
      .expect(404);
  });

  it('should answer 404 on the calendar routes of a non-calendar integration', async () => {
    await seedService({
      name: 'ext-dev-device',
      selector: 'ext-dev-device',
      manifest: { ...CALENDAR_MANIFEST, type: 'device', account_schema: undefined },
    });
    await authenticatedRequest.get('/api/v1/external_integration/ext-dev-device/calendar/account').expect(404);
  });
});
