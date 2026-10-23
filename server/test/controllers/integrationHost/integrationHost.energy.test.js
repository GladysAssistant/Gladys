const { expect } = require('chai');
const request = require('supertest');
const db = require('../../../models');
const { generateIntegrationToken } = require('../../../utils/integrationToken');
const {
  SERVICE_STATUS,
  SERVICE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');
const { TEST_ENERGY_MANIFEST } = require('../../lib/external-integration/testUtils.test');

const TEST_ENERGY_MANIFEST_SELECTOR = 'ext-dev-octopus-energy-demo';

const seedEnergyService = async (overrides = {}) =>
  (
    await db.Service.create({
      name: TEST_ENERGY_MANIFEST_SELECTOR,
      selector: TEST_ENERGY_MANIFEST_SELECTOR,
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
    gladys.energyContract.meterRecalculations.forEach((state) => clearTimeout(state.timer));
    gladys.energyContract.meterRecalculations.clear();
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

  describe('GET /api/integration/v1/energy/price', () => {
    const batteryExternalId = `ext:${TEST_ENERGY_MANIFEST_SELECTOR}:battery`;
    const HOUR_MS = 60 * 60 * 1000;
    const window = (fromMs, toMs) =>
      `from=${encodeURIComponent(new Date(fromMs).toISOString())}&to=${encodeURIComponent(
        new Date(toMs).toISOString(),
      )}`;
    let meter;
    beforeEach(async () => {
      await db.Service.update(
        { manifest: { ...TEST_ENERGY_MANIFEST, energy_prices: true } },
        { where: { id: service.id } },
      );
      meter = await gladys.device.create({
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Main meter',
        external_id: 'main-meter',
        selector: 'main-meter',
        features: [],
      });
      // a home battery: no energy source feature, it is on the main meter
      await gladys.device.create({
        service_id: service.id,
        name: 'Battery',
        external_id: batteryExternalId,
        selector: 'battery',
        features: [],
      });
    });
    afterEach(async () => {
      gladys.externalIntegration.energyPriceRateLimits.clear();
      await gladys.device.destroy('battery');
      await gladys.device.destroy('main-meter');
    });

    it('should return the energy price of the main meter, never the contract nor the meter', async () => {
      await gladys.energyContract.create({
        name: 'Base',
        electric_meter_device_id: meter.id,
        valid_from: '2025-01-01',
        currency: 'EUR',
        timezone: 'UTC',
        tariff: {
          tariff_version: 1,
          components: [
            { key: 'energy', kind: 'consumption', rules: [], fallback: { label: 'Base', price: 0.2 } },
            { key: 'subscription', kind: 'fixed', amount: 12, per: 'month' },
          ],
        },
      });
      const slotStart = Math.floor(Date.now() / (30 * 60 * 1000)) * 30 * 60 * 1000;
      const prices = await api()
        .get(
          `/api/integration/v1/energy/price?device_external_id=${batteryExternalId}&${window(
            slotStart,
            slotStart + HOUR_MS,
          )}`,
        )
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => res.body);
      expect(prices).to.deep.equal({
        currency: 'EUR',
        slots: [
          {
            starts_at: new Date(slotStart).toISOString(),
            ends_at: new Date(slotStart + HOUR_MS / 2).toISOString(),
            price: 0.2,
            label: 'Base',
          },
          {
            starts_at: new Date(slotStart + HOUR_MS / 2).toISOString(),
            ends_at: new Date(slotStart + HOUR_MS).toISOString(),
            price: 0.2,
            label: 'Base',
          },
        ],
      });
    });

    it('should answer 403 without energy_prices: true in the manifest', async () => {
      await db.Service.update({ manifest: TEST_ENERGY_MANIFEST }, { where: { id: service.id } });
      await api()
        .get(
          `/api/integration/v1/energy/price?device_external_id=${batteryExternalId}&${window(
            Date.now(),
            Date.now() + HOUR_MS,
          )}`,
        )
        .expect(403);
    });

    it('should answer 400 on an invalid window and 404 on a device not ours or not on a meter', async () => {
      await api()
        .get(`/api/integration/v1/energy/price?device_external_id=${batteryExternalId}&from=yesterday&to=now`)
        .expect(400);
      await api()
        .get(
          `/api/integration/v1/energy/price?device_external_id=${batteryExternalId}&${window(
            Date.now(),
            Date.now() + 8 * 24 * HOUR_MS,
          )}`,
        )
        .expect(400);
      // the meter belongs to another service: invisible, like an unknown device
      await api()
        .get(
          `/api/integration/v1/energy/price?device_external_id=main-meter&${window(Date.now(), Date.now() + HOUR_MS)}`,
        )
        .expect(404)
        .then((res) => expect(res.body.message).to.equal('DEVICE_NOT_FOUND'));
      // no contract in the instance: no main meter
      await api()
        .get(
          `/api/integration/v1/energy/price?device_external_id=${batteryExternalId}&${window(
            Date.now(),
            Date.now() + HOUR_MS,
          )}`,
        )
        .expect(404)
        .then((res) => expect(res.body.message).to.equal('DEVICE_NOT_ON_ELECTRIC_METER'));
    });
  });

  describe('POST /api/integration/v1/energy/consumption', () => {
    const consumptionExternalId = `ext:${TEST_ENERGY_MANIFEST_SELECTOR}:meter:consumption`;
    beforeEach(async () => {
      // the main electric meter of the house, with the cumulative index the discovery attaches
      // a published consumption to
      const mainMeter = await gladys.device.create({
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        name: 'Main meter',
        external_id: 'main-meter',
        selector: 'main-meter',
        features: [
          {
            name: 'Index',
            external_id: 'main-meter-index',
            selector: 'main-meter-index',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
            read_only: true,
            has_feedback: false,
            keep_history: true,
            min: 0,
            max: 100000000000,
          },
        ],
      });
      await gladys.device.create({
        service_id: service.id,
        name: 'Hydro meter',
        external_id: `ext:${TEST_ENERGY_MANIFEST_SELECTOR}:meter`,
        selector: 'hydro-meter',
        features: [
          {
            name: 'Consumption',
            external_id: consumptionExternalId,
            selector: 'hydro-meter-consumption',
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
            read_only: true,
            has_feedback: false,
            keep_history: true,
            min: 0,
            max: 100000000000,
            energy_parent_id: mainMeter.features[0].id,
          },
        ],
      });
    });
    afterEach(async () => {
      await gladys.device.destroy('hydro-meter');
      await gladys.device.destroy('main-meter');
    });

    it('should upsert the published intervals and answer their count and the earliest change', async () => {
      const published = await api()
        .post('/api/integration/v1/energy/consumption')
        .send({
          device_feature_external_id: consumptionExternalId,
          intervals: [
            { starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 },
            { starts_at: '2026-01-12T05:30:00Z', kwh: 0.38 },
          ],
        })
        .expect(200)
        .then((res) => res.body);
      expect(published).to.deep.equal({ success: true, count: 2, changed_from: '2026-01-12T05:30:00.000Z' });
      const states = await gladys.device.getDeviceFeatureStates(
        'hydro-meter-consumption',
        new Date('2026-01-12T00:00:00Z'),
        new Date('2026-01-13T00:00:00Z'),
      );
      expect(states.map((state) => [new Date(state.created_at).toISOString(), state.value])).to.deep.equal([
        ['2026-01-12T05:30:00.000Z', 0.42],
        ['2026-01-12T06:00:00.000Z', 0.38],
      ]);
      // a correction replaces the stored value, a republication of the rest writes nothing
      const corrected = await api()
        .post('/api/integration/v1/energy/consumption')
        .send({
          device_feature_external_id: consumptionExternalId,
          intervals: [
            { starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 },
            { starts_at: '2026-01-12T05:30:00Z', kwh: 0.5 },
          ],
        })
        .expect(200)
        .then((res) => res.body);
      expect(corrected).to.deep.equal({ success: true, count: 2, changed_from: '2026-01-12T06:00:00.000Z' });
      const unchanged = await api()
        .post('/api/integration/v1/energy/consumption')
        .send({
          device_feature_external_id: consumptionExternalId,
          intervals: [{ starts_at: '2026-01-12T05:30:00Z', kwh: 0.5 }],
        })
        .expect(200)
        .then((res) => res.body);
      expect(unchanged).to.deep.equal({ success: true, count: 1, changed_from: null });
    });

    it('should answer 400 outside the integration or on an invalid interval, 404 on a device not created', async () => {
      await api()
        .post('/api/integration/v1/energy/consumption')
        .send({
          device_feature_external_id: 'ext:other:meter',
          intervals: [{ starts_at: '2026-01-12T05:00:00Z', kwh: 1 }],
        })
        .expect(400);
      await api()
        .post('/api/integration/v1/energy/consumption')
        .send({
          device_feature_external_id: `ext:${TEST_ENERGY_MANIFEST_SELECTOR}:unknown`,
          intervals: [{ starts_at: '2026-01-12T05:00:00Z', kwh: 1 }],
        })
        .expect(404);
      await api()
        .post('/api/integration/v1/energy/consumption')
        .send({
          device_feature_external_id: consumptionExternalId,
          intervals: [{ starts_at: '2026-01-12T05:15:00Z', kwh: 1 }],
        })
        .expect(400);
    });
  });
});
