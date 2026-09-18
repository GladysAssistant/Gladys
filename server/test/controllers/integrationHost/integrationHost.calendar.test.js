const { expect } = require('chai');
const request = require('supertest');

const db = require('../../../models');
const { generateIntegrationToken } = require('../../../utils/integrationToken');

const JOHN_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const CALENDAR_MANIFEST = {
  manifest_version: 1,
  type: 'calendar',
  name: 'Nextcloud Calendar',
  description: { en: 'Nextcloud calendar provider demo integration.' },
  version: '1.0.0',
  docker_image: 'ghcr.io/john/gladys-nextcloud-calendar:1.0.0',
  gladys_version: '>=0.1.0',
  account_schema: [{ key: 'server_url', type: 'string', label: { en: 'Server URL' } }],
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

const integrationRequest = (token) => ({
  get: (url) =>
    request(TEST_BACKEND_APP)
      .get(url)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`),
  post: (url) =>
    request(TEST_BACKEND_APP)
      .post(url)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`),
  delete: (url) =>
    request(TEST_BACKEND_APP)
      .delete(url)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${token}`),
});

describe('Integration host API: calendar', () => {
  let gladys;
  let service;
  let token;
  const prefix = 'ext:ext-dev-nextcloud-calendar:john:';

  beforeEach(async () => {
    gladys = global.TEST_GLADYS_INSTANCE;
    service = await seedService();
    token = generateIntegrationToken(service.id, 1, 'secret');
    await gladys.externalIntegration.saveCalendarAccount(service.selector, JOHN_USER_ID, {
      server_url: 'https://cloud.example.com',
    });
  });

  afterEach(() => {
    gladys.externalIntegration.calendarWriteRateLimits.clear();
    gladys.externalIntegration.clearTimers(service.id);
  });

  it('should list the enabled accounts, secrets included', async () => {
    const res = await integrationRequest(token)
      .get('/api/integration/v1/calendar/account')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(res.body).to.deep.equal([
      {
        user: { selector: 'john', first_name: 'John', language: 'en' },
        config: { server_url: 'https://cloud.example.com' },
      },
    ]);
  });

  it('should publish calendars, then events with a window, and read them back', async () => {
    const publishRes = await integrationRequest(token)
      .post('/api/integration/v1/calendar')
      .send({
        user: 'john',
        calendars: [
          { external_id: `${prefix}primary`, name: 'Primary', color: '#AB12CD', description: 'Main calendar' },
        ],
      })
      .expect(200);
    expect(publishRes.body).to.deep.equal({ success: true, created: 1, updated: 0 });

    const eventsRes = await integrationRequest(token)
      .post('/api/integration/v1/calendar/event')
      .send({
        calendar_external_id: `${prefix}primary`,
        window: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
        events: [
          {
            external_id: `${prefix}uid-1`,
            name: 'Dentist',
            start: '2026-08-14T09:00:00.000Z',
            end: '2026-08-14T09:30:00.000Z',
            location: 'Paris',
            url: 'https://example.com/event',
          },
        ],
      })
      .expect(200);
    expect(eventsRes.body).to.deep.equal({ success: true, created: 1, updated: 0, deleted: 0 });

    const listRes = await integrationRequest(token)
      .get('/api/integration/v1/calendar?user=john')
      .expect(200);
    expect(listRes.body).to.have.lengthOf(1);
    expect(listRes.body[0]).to.deep.include({
      user: 'john',
      external_id: `${prefix}primary`,
      selector: 'primary',
      name: 'Primary',
      description: 'Main calendar',
      color: '#ab12cd',
      sync: true,
      shared: false,
    });

    // and the deletion path
    await integrationRequest(token)
      .delete(`/api/integration/v1/calendar?external_id=${encodeURIComponent(`${prefix}primary`)}`)
      .expect(200);
    const afterDelete = await integrationRequest(token)
      .get('/api/integration/v1/calendar')
      .expect(200);
    expect(afterDelete.body).to.deep.equal([]);
  });

  it('should answer 403 on every calendar endpoint for a non-calendar integration', async () => {
    const deviceService = await seedService({
      name: 'ext-dev-device',
      selector: 'ext-dev-device',
      manifest: { ...CALENDAR_MANIFEST, type: 'device', account_schema: undefined },
    });
    const deviceToken = generateIntegrationToken(deviceService.id, 1, 'secret');
    await integrationRequest(deviceToken)
      .get('/api/integration/v1/calendar/account')
      .expect(403);
    await integrationRequest(deviceToken)
      .get('/api/integration/v1/calendar')
      .expect(403);
    await integrationRequest(deviceToken)
      .post('/api/integration/v1/calendar')
      .send({ user: 'john', calendars: [] })
      .expect(403);
    await integrationRequest(deviceToken)
      .delete('/api/integration/v1/calendar?external_id=x')
      .expect(403);
    await integrationRequest(deviceToken)
      .post('/api/integration/v1/calendar/event')
      .send({ calendar_external_id: 'x', events: [] })
      .expect(403);
  });

  it('should refuse an external_id without the user-scoped prefix', async () => {
    await integrationRequest(token)
      .post('/api/integration/v1/calendar')
      .send({ user: 'john', calendars: [{ external_id: 'ext:ext-dev-nextcloud-calendar:primary', name: 'X' }] })
      .expect(400);
  });

  it('should answer 404 for a user who did not enable the integration', async () => {
    await integrationRequest(token)
      .post('/api/integration/v1/calendar')
      .send({ user: 'unknown-user', calendars: [] })
      .expect(404);
  });

  it('should reject invalid events naming the entry', async () => {
    await integrationRequest(token)
      .post('/api/integration/v1/calendar')
      .send({ user: 'john', calendars: [{ external_id: `${prefix}primary`, name: 'Primary' }] })
      .expect(200);
    const res = await integrationRequest(token)
      .post('/api/integration/v1/calendar/event')
      .send({
        calendar_external_id: `${prefix}primary`,
        events: [
          {
            external_id: `${prefix}uid-1`,
            name: 'Bad',
            start: '2026-08-14T09:00:00.000Z',
            end: '2026-08-14T08:00:00.000Z',
          },
        ],
      })
      .expect(400);
    expect(res.body.message).to.include('events[0].end');
  });

  it('should reject an event not overlapping the window', async () => {
    await integrationRequest(token)
      .post('/api/integration/v1/calendar')
      .send({ user: 'john', calendars: [{ external_id: `${prefix}primary`, name: 'Primary' }] })
      .expect(200);
    await integrationRequest(token)
      .post('/api/integration/v1/calendar/event')
      .send({
        calendar_external_id: `${prefix}primary`,
        window: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
        events: [{ external_id: `${prefix}uid-1`, name: 'Out', start: '2026-07-01T09:00:00.000Z' }],
      })
      .expect(400);
  });

  it('should isolate tenants: another integration cannot touch the calendars', async () => {
    await integrationRequest(token)
      .post('/api/integration/v1/calendar')
      .send({ user: 'john', calendars: [{ external_id: `${prefix}primary`, name: 'Primary' }] })
      .expect(200);
    const otherService = await seedService({
      name: 'ext-dev-other-calendar',
      selector: 'ext-dev-other-calendar',
    });
    const otherToken = generateIntegrationToken(otherService.id, 1, 'secret');
    // the other integration sees nothing
    const listRes = await integrationRequest(otherToken)
      .get('/api/integration/v1/calendar')
      .expect(200);
    expect(listRes.body).to.deep.equal([]);
    // and cannot delete nor push events into the first one's calendar
    await integrationRequest(otherToken)
      .delete(`/api/integration/v1/calendar?external_id=${encodeURIComponent(`${prefix}primary`)}`)
      .expect(404);
    await integrationRequest(otherToken)
      .post('/api/integration/v1/calendar/event')
      .send({ calendar_external_id: `${prefix}primary`, events: [] })
      .expect(404);
    gladys.externalIntegration.clearTimers(otherService.id);
  });

  it('should rate limit the write endpoints to 30 per minute', async () => {
    const payload = { user: 'john', calendars: [{ external_id: `${prefix}primary`, name: 'Primary' }] };
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < 30; i++) {
      // eslint-disable-next-line no-await-in-loop
      await integrationRequest(token)
        .post('/api/integration/v1/calendar')
        .send(payload)
        .expect(200);
    }
    await integrationRequest(token)
      .post('/api/integration/v1/calendar')
      .send(payload)
      .expect(429);
  });
});
