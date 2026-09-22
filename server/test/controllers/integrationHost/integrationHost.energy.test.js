const { expect } = require('chai');
const request = require('supertest');
const db = require('../../../models');
const { generateIntegrationToken } = require('../../../utils/integrationToken');
const { SERVICE_STATUS, SERVICE_TYPES } = require('../../../utils/constants');
const { TEST_ENERGY_MANIFEST } = require('../../lib/external-integration/testUtils.test');

const seedEnergyService = async (overrides = {}) =>
  (
    await db.Service.create({
      name: 'ext-dev-octopus-energy-demo',
      selector: 'ext-dev-octopus-energy-demo',
      version: '1.2.0',
      status: SERVICE_STATUS.RUNNING,
      type: SERVICE_TYPES.EXTERNAL,
      docker_image: TEST_ENERGY_MANIFEST.docker_image,
      manifest: TEST_ENERGY_MANIFEST,
      token_version: 1,
      ...overrides,
    })
  ).get({ plain: true });

describe('Integration host API: energy contracts', () => {
  let gladys;
  let service;
  let token;
  const api = () => ({
    get: (url) =>
      // @ts-ignore
      request(TEST_BACKEND_APP)
        .get(url)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`),
    post: (url) =>
      // @ts-ignore
      request(TEST_BACKEND_APP)
        .post(url)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`),
  });

  beforeEach(async () => {
    // @ts-ignore
    gladys = global.TEST_GLADYS_INSTANCE;
    service = await seedEnergyService();
    token = generateIntegrationToken(service.id, 1, 'secret');
    await gladys.externalIntegration.declareEnergyCalendars(service);
  });
  afterEach(async () => {
    gladys.externalIntegration.energyCalendarRefreshTimes.clear();
    gladys.energyContract.calendarRecalculations.forEach((state) => clearTimeout(state.timer));
    gladys.energyContract.calendarRecalculations.clear();
    await db.TariffCalendar.destroy({ where: {} });
    await db.EnergyContract.destroy({ where: {} });
  });

  it('should publish a declared calendar and read it back', async () => {
    const published = await api()
      .post('/api/integration/v1/energy/calendar')
      .send({ calendar_key: 'agile-gb', entries: [{ starts_at: '2026-01-12T00:00:00Z', value: 'cap' }] })
      .expect(200)
      .then((res) => res.body);
    expect(published).to.deep.include({ success: true, count: 1, changed_from: '2026-01-12T00:00:00.000Z' });
    const entries = await api()
      .get('/api/integration/v1/energy/calendar/agile-gb?from=2026-01-01&to=2026-02-01')
      .expect(200)
      .then((res) => res.body);
    expect(entries).to.deep.equal([{ starts_at: '2026-01-12T00:00:00.000Z', value: 'cap' }]);
    const last = await api()
      .get('/api/integration/v1/energy/calendar/agile-gb?limit=1')
      .expect(200)
      .then((res) => res.body);
    expect(last).to.have.lengthOf(1);
  });

  it('should answer 403 on an undeclared key and 400 on invalid entries', async () => {
    await api()
      .post('/api/integration/v1/energy/calendar')
      .send({ calendar_key: 'tempo', entries: [{ starts_at: '2026-01-12T00:00:00Z', value: 'red' }] })
      .expect(403);
    await api()
      .get('/api/integration/v1/energy/calendar/tempo')
      .expect(403);
    await api()
      .post('/api/integration/v1/energy/calendar')
      .send({ calendar_key: 'agile-gb', entries: [{ starts_at: '2026-01-12T00:00:00Z', value: 'purple' }] })
      .expect(400)
      .then((res) => expect(res.body.message).to.contain('"purple" is not in [cap, normal]'));
    await api()
      .post('/api/integration/v1/energy/calendar')
      .send({ calendar_key: 'agile-gb', entries: [{ starts_at: '2026-01-12T00:10:00Z', value: 'cap' }] })
      .expect(400)
      .then((res) => expect(res.body.message).to.contain('local midnight'));
    await api()
      .post('/api/integration/v1/energy/calendar')
      .send({ calendar_key: 'agile-gb', entries: [] })
      .expect(400);
    await api()
      .post('/api/integration/v1/energy/calendar')
      .send({ entries: [] })
      .expect(400);
  });

  it('should list the contracts referencing the integration templates', async () => {
    const meter = await gladys.device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Host meter',
      external_id: 'host-meter',
      selector: 'host-meter',
      features: [],
    });
    await gladys.energyContract.create({
      name: 'Agile',
      electric_meter_device_id: meter.id,
      valid_from: '2026-01-01',
      currency: 'GBP',
      timezone: 'Europe/London',
      pricing_mode: 'delegated',
      provider_kind: 'integration',
      provider_service_id: service.id,
      template_key: 'agile',
      inputs: { region: 'A' },
      tariff: { tariff_version: 1, components: [{ key: 'standing', kind: 'fixed', amount: 0.5, per: 'day' }] },
    });
    const contracts = await api()
      .get('/api/integration/v1/energy/contract')
      .expect(200)
      .then((res) => res.body);
    expect(contracts).to.have.lengthOf(1);
    expect(contracts[0]).to.deep.include({
      template_key: 'agile',
      inputs: { region: 'A' },
      currency: 'GBP',
      status: 'active',
    });
    expect(contracts[0]).to.not.have.property('electric_meter_device_id');
    await gladys.device.destroy('host-meter');
  });
});
