const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const db = require('../../../models');
const { authenticatedRequest } = require('../request.test');
const { EDF_TEMPO_TEMPLATE, TEMPO_CALENDAR } = require('../../../lib/energy-contract/templates/internal');

const TARIFF = {
  tariff_version: 1,
  components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } }],
};

describe('energy_contract API', () => {
  let gladys;
  let meterId;
  beforeEach(async () => {
    gladys = global.TEST_GLADYS_INSTANCE;
    const meter = await gladys.device.create({
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'API meter',
      external_id: 'api-meter',
      selector: 'api-meter',
      features: [
        {
          external_id: 'api-meter-consumption',
          selector: 'api-meter-consumption',
          name: 'Consumption',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 1000,
          category: 'energy-sensor',
          type: 'thirty-minutes-consumption',
        },
      ],
    });
    meterId = meter.id;
    gladys.energyContract.catalogueCache = {
      expires_at: Date.now() + 60000,
      value: { templates: [], calendars: [], version: 'v0', format: 2 },
    };
  });
  afterEach(async () => {
    sinon.restore();
    gladys.energyContract.catalogueCache = null;
    await db.EnergyContract.destroy({ where: {} });
    await db.TariffCalendar.destroy({ where: {} });
    await gladys.device.destroy('api-meter');
  });

  const payload = (overrides = {}) => ({
    name: 'API contract',
    electric_meter_device_id: meterId,
    valid_from: '2025-01-01',
    currency: 'EUR',
    tariff: TARIFF,
    ...overrides,
  });

  it('should create, list, read, update and delete a contract', async () => {
    const created = await authenticatedRequest
      .post('/api/v1/energy_contract')
      .send(payload())
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => res.body);
    expect(created).to.include({ selector: 'api-contract', status: 'active', pricing_mode: 'rules' });
    await authenticatedRequest
      .get(`/api/v1/energy_contract?electric_meter_device_id=${meterId}`)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.lengthOf(1);
        expect(res.body[0].selector).to.equal('api-contract');
      });
    await authenticatedRequest
      .get('/api/v1/energy_contract/api-contract')
      .expect(200)
      .then((res) => expect(res.body.name).to.equal('API contract'));
    await authenticatedRequest
      .patch('/api/v1/energy_contract/api-contract')
      .send({ name: 'Renamed' })
      .expect(200)
      .then((res) => expect(res.body.name).to.equal('Renamed'));
    await authenticatedRequest
      .get('/api/v1/energy_contract/api-contract/current')
      .expect(200)
      .then((res) => expect(res.body).to.include({ price: 0.2, currency: 'EUR', unit: 'kWh' }));
    await authenticatedRequest
      .delete('/api/v1/energy_contract/api-contract')
      .expect(200)
      .then((res) => expect(res.body).to.deep.equal({ success: true }));
    await authenticatedRequest.get('/api/v1/energy_contract/api-contract').expect(404);
  });

  it('should answer 400 on an invalid tariff and 409 on an overlap', async () => {
    await authenticatedRequest
      .post('/api/v1/energy_contract')
      .send(payload({ tariff: { tariff_version: 1, components: [{ key: 'e', kind: 'consumption', rules: [] }] } }))
      .expect(400)
      .then((res) => expect(res.body.message).to.contain('tariff.components[0]'));
    await authenticatedRequest
      .post('/api/v1/energy_contract')
      .send(payload())
      .expect(201);
    await authenticatedRequest
      .post('/api/v1/energy_contract')
      .send(payload({ name: 'Other' }))
      .expect(409);
  });

  it('should preview a tariff and serve the templates', async () => {
    gladys.stateManager.setState('service', 'edf-tempo', {
      energyContracts: { templates: [EDF_TEMPO_TEMPLATE], calendars: [TEMPO_CALENDAR] },
    });
    await authenticatedRequest
      .post('/api/v1/energy_contract/preview')
      .send({
        tariff: TARIFF,
        currency: 'EUR',
        from: '2026-01-01',
        to: '2026-01-02',
        electric_meter_device_id: meterId,
      })
      .expect(200)
      .then((res) => {
        expect(res.body.synthetic).to.equal(true);
        expect(res.body.intervals).to.equal(48);
        expect(res.body.components).to.deep.equal({ energy: 4.8 });
      });
    await authenticatedRequest
      .get('/api/v1/energy_contract/template')
      .expect(200)
      .then((res) => {
        expect(res.body.map((t) => t.key)).to.include('edf-tempo');
      });
    await authenticatedRequest
      .get('/api/v1/energy_contract/template/internal/edf-tempo')
      .expect(200)
      .then((res) => expect(res.body.tariff.calendars).to.deep.equal(['tempo']));
    await authenticatedRequest.get('/api/v1/energy_contract/template/community/nope?variant=6').expect(404);
    gladys.stateManager.deleteState('service', 'edf-tempo');
  });

  it('should request a recalculation from a date', async () => {
    await authenticatedRequest
      .post('/api/v1/energy_contract/recalculate')
      .send({ from: '2026-01-01' })
      .expect(200)
      .then((res) => expect(res.body).to.deep.include({ success: true, from: '2026-01-01T00:00:00.000Z' }));
    await authenticatedRequest
      .post('/api/v1/energy_contract/recalculate')
      .send({})
      .expect(400);
  });

  it('should list the calendars and their entries', async () => {
    await gladys.energyContract.declareCalendar({ key: 'api-cal', granularity: 'day', values: ['a'] }, null);
    await gladys.energyContract.publishCalendarEntries('api-cal', [{ date: '2026-01-12', value: 'a' }], {
      skip_recalculation: true,
    });
    await authenticatedRequest
      .get('/api/v1/energy_calendar')
      .expect(200)
      .then((res) => {
        const calendar = res.body.find((c) => c.key === 'api-cal');
        expect(calendar.orphaned).to.equal(true);
      });
    await authenticatedRequest
      .get('/api/v1/energy_calendar/api-cal?from=2026-01-01&to=2026-02-01&limit=10')
      .expect(200)
      .then((res) => expect(res.body).to.have.lengthOf(1));
    await authenticatedRequest.get('/api/v1/energy_calendar/nope').expect(404);
  });
});
