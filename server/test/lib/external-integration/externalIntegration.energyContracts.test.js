const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError, ForbiddenError, BadParameters } = require('../../../utils/coreErrors');
const {
  ENERGY_CONTRACT_PRICE_TIMEOUT_MS,
  ENERGY_CONTRACT_CURRENT_TIMEOUT_MS,
  ENERGY_CALENDAR_REFRESH_MIN_INTERVAL_MS,
} = require('../../../lib/external-integration/constants');
const {
  normalizeEnergyCosts,
  normalizeEnergyCurrent,
} = require('../../../lib/external-integration/externalIntegration.normalizeEnergyCosts');
const { buildSupervisor, seedExternalService, TEST_ENERGY_MANIFEST } = require('./testUtils.test');

const seedEnergyService = (overrides = {}) => seedExternalService({ manifest: TEST_ENERGY_MANIFEST, ...overrides });
const INTERVALS = [
  { starts_at: '2026-01-12T05:00:00.000Z', kwh: 1, max_power_kw: 2 },
  { starts_at: '2026-01-12T05:30:00.000Z', kwh: 0.5, max_power_kw: 1 },
];

describe('externalIntegration: energy contracts capability', () => {
  afterEach(() => sinon.restore());

  describe('normalizeEnergyCosts', () => {
    it('should accept one cost per requested interval and ignore unrequested ones', () => {
      const answers = normalizeEnergyCosts(
        {
          costs: [
            { starts_at: '2026-01-12T05:00:00Z', cost: 0.2, components: { energy: 0.15, tax: 0.05 }, label: 'agile' },
            { starts_at: '2026-01-12T05:30:00.000Z', cost: 0.1234567 },
            { starts_at: '2026-01-12T06:00:00Z', cost: 99 },
          ],
        },
        INTERVALS,
      );
      expect(Array.from(answers.entries())).to.deep.equal([
        ['2026-01-12T05:00:00.000Z', { cost: 0.2, components: { energy: 0.15, tax: 0.05 }, label: 'agile' }],
        ['2026-01-12T05:30:00.000Z', { cost: 0.123457, components: { energy: 0.123457 }, label: undefined }],
      ]);
    });

    it('should reject an invalid payload', () => {
      const reject = (payload, message) => {
        expect(() => normalizeEnergyCosts(payload, INTERVALS)).to.throw(ExternalIntegrationUnavailableError, message);
      };
      reject(null, 'EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS');
      reject({ costs: 'x' }, 'EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS');
      reject({ costs: [null] }, 'costs[0]');
      reject({ costs: [{ starts_at: 'nope', cost: 1 }] }, 'costs[0].starts_at');
      reject({ costs: [{ starts_at: '2026-01-12T05:00:00Z', cost: 0.2 }] }, 'missing 2026-01-12T05:30:00.000Z');
      reject(
        {
          costs: [
            { starts_at: '2026-01-12T05:00:00Z', cost: 0.2 },
            { starts_at: '2026-01-12T05:00:00Z', cost: 0.2 },
            { starts_at: '2026-01-12T05:30:00Z', cost: 0.2 },
          ],
        },
        'duplicate 2026-01-12T05:00:00.000Z',
      );
      const both = (first) => ({ costs: [first, { starts_at: '2026-01-12T05:30:00Z', cost: 0.1 }] });
      reject(both({ starts_at: '2026-01-12T05:00:00Z', cost: -1 }), 'must be a number between 0 and 10');
      reject(both({ starts_at: '2026-01-12T05:00:00Z', cost: 11 }), 'must be a number between 0 and 10');
      reject(both({ starts_at: '2026-01-12T05:00:00Z', cost: 'x' }), 'must be a number');
      reject(both({ starts_at: '2026-01-12T05:00:00Z', cost: Infinity }), 'must be a number');
      reject(both({ starts_at: '2026-01-12T05:00:00Z', cost: 1, components: [] }), 'components of');
      reject(both({ starts_at: '2026-01-12T05:00:00Z', cost: 1, components: { 'Bad Key': 1 } }), 'component "Bad Key"');
      reject(both({ starts_at: '2026-01-12T05:00:00Z', cost: 1, components: { energy: 'x' } }), 'component "energy"');
    });

    it('should normalize the current price answer', () => {
      expect(
        normalizeEnergyCurrent({
          price: 0.18,
          valid_until: '2026-01-12T06:00:00Z',
          next_price: 0.25,
          label: 'off-peak',
        }),
      ).to.deep.equal({
        price: 0.18,
        unit: 'kWh',
        label: 'off-peak',
        valid_until: '2026-01-12T06:00:00.000Z',
        next_price: 0.25,
        next_label: undefined,
      });
      expect(normalizeEnergyCurrent({ price: null })).to.deep.include({
        price: null,
        valid_until: null,
        next_price: null,
      });
      expect(normalizeEnergyCurrent({ price: -0.01, next_label: 'x' })).to.deep.include({
        price: -0.01,
        next_label: 'x',
      });
      expect(() => normalizeEnergyCurrent(null)).to.throw(ExternalIntegrationUnavailableError);
      expect(() => normalizeEnergyCurrent({ price: 'x' })).to.throw(ExternalIntegrationUnavailableError, 'price');
      expect(() => normalizeEnergyCurrent({ price: 11 })).to.throw(ExternalIntegrationUnavailableError, 'price');
      expect(() => normalizeEnergyCurrent({ price: 1, next_price: -20 })).to.throw(
        ExternalIntegrationUnavailableError,
        'next_price',
      );
      expect(() => normalizeEnergyCurrent({ price: 1, valid_until: 'nope' })).to.throw(
        ExternalIntegrationUnavailableError,
        'valid_until',
      );
    });
  });

  describe('priceEnergyContract / getEnergyContractCurrent', () => {
    it('should relay the request over websocket and normalize the answer', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedEnergyService();
      externalIntegration.sendCommand = fake.resolves({
        success: true,
        data: { costs: INTERVALS.map((i) => ({ starts_at: i.starts_at, cost: i.kwh * 0.1 })) },
      });
      const contract = {
        id: 'contract-id',
        provider_service_id: service.id,
        template_key: 'agile',
        inputs: { region: 'A' },
        currency: 'GBP',
        timezone: 'Europe/London',
        billing_period_start_day: 1,
      };
      const request = {
        billing_period: { starts_at: '2026-01-01T00:00:00.000Z', ends_at: '2026-02-01T00:00:00.000Z' },
        cumulative_before: { day: 0, month: 0, billing_period: 0 },
        intervals: INTERVALS,
      };
      const answers = await externalIntegration.priceEnergyContract(contract, request);
      expect(answers.get('2026-01-12T05:00:00.000Z').cost).to.equal(0.1);
      const [passedService, type, payload, options] = externalIntegration.sendCommand.firstCall.args;
      expect(passedService.id).to.equal(service.id);
      expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ENERGY_CONTRACT_PRICE);
      expect(payload.contract).to.deep.equal({
        id: 'contract-id',
        template_key: 'agile',
        inputs: { region: 'A' },
        currency: 'GBP',
        timezone: 'Europe/London',
        billing_period_start_day: 1,
      });
      expect(payload.intervals).to.deep.equal(INTERVALS);
      expect(options).to.deep.equal({ timeoutMs: ENERGY_CONTRACT_PRICE_TIMEOUT_MS });
      // current price
      externalIntegration.sendCommand = fake.resolves({ success: true, data: { price: 0.2, valid_until: null } });
      const current = await externalIntegration.getEnergyContractCurrent(
        { ...contract, inputs: null, billing_period_start_day: undefined },
        {
          billing_period: request.billing_period,
          cumulative: { day: 1, month: 2, billing_period: 3 },
          max_power_kw: 2,
        },
      );
      expect(current.price).to.equal(0.2);
      const [, currentType, currentPayload, currentOptions] = externalIntegration.sendCommand.firstCall.args;
      expect(currentType).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ENERGY_CONTRACT_CURRENT);
      expect(currentPayload.contract.inputs).to.deep.equal({});
      expect(currentPayload.contract.billing_period_start_day).to.equal(1);
      expect(currentPayload.cumulative).to.deep.equal({ day: 1, month: 2, billing_period: 3 });
      expect(currentOptions).to.deep.equal({ timeoutMs: ENERGY_CONTRACT_CURRENT_TIMEOUT_MS });
    });

    it('should fail on an orphaned contract, a missing service, an invalid request or a timeout', async () => {
      const { externalIntegration } = buildSupervisor();
      const service = await seedEnergyService();
      const request = { billing_period: {}, cumulative_before: {}, intervals: INTERVALS };
      await expect(externalIntegration.priceEnergyContract({ provider_service_id: null }, request)).to.be.rejectedWith(
        ExternalIntegrationUnavailableError,
        'EXTERNAL_INTEGRATION_ENERGY_CONTRACT_ORPHANED',
      );
      await expect(
        externalIntegration.priceEnergyContract(
          { provider_service_id: 'e5d6a8f0-0000-4000-8000-000000000000' },
          request,
        ),
      ).to.be.rejectedWith('EXTERNAL_INTEGRATION_ENERGY_CONTRACT_ORPHANED');
      await expect(
        externalIntegration.priceEnergyContract({ provider_service_id: service.id }, { intervals: [] }),
      ).to.be.rejectedWith(BadParameters, 'intervals: must be a non-empty array');
      await expect(
        externalIntegration.priceEnergyContract(
          { provider_service_id: service.id },
          { intervals: new Array(1489).fill(INTERVALS[0]) },
        ),
      ).to.be.rejectedWith(BadParameters, 'at most 1488 intervals');
      externalIntegration.sendCommand = fake.rejects(
        new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT'),
      );
      await expect(
        externalIntegration.priceEnergyContract({ provider_service_id: service.id }, request),
      ).to.be.rejectedWith('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT');
      externalIntegration.sendCommand = fake.resolves({ success: true });
      await expect(
        externalIntegration.priceEnergyContract({ provider_service_id: service.id }, request),
      ).to.be.rejectedWith('EXTERNAL_INTEGRATION_INVALID_ENERGY_COSTS');
      await expect(
        externalIntegration.getEnergyContractCurrent({ provider_service_id: service.id }, {}),
      ).to.be.rejectedWith('EXTERNAL_INTEGRATION_INVALID_ENERGY_CURRENT');
    });
  });

  describe('calendars: declaration, host API, refresh nudge', () => {
    it('should declare the manifest calendars and collect the refused ones', async () => {
      const { externalIntegration, energyContract } = buildSupervisor();
      const service = await seedEnergyService();
      expect(await externalIntegration.declareEnergyCalendars(service)).to.deep.equal([]);
      sinonAssert.calledWith(
        energyContract.declareCalendar,
        TEST_ENERGY_MANIFEST.energy_contracts.calendars[0],
        service.id,
      );
      energyContract.declareCalendar = fake.resolves({
        accepted: false,
        reason: 'calendar "agile-gb" is already provided by another integration',
      });
      expect(await externalIntegration.declareEnergyCalendars(service)).to.deep.equal([
        'calendar "agile-gb" is already provided by another integration',
      ]);
      energyContract.declareCalendar = fake.rejects(new Error('granularity conflict'));
      expect(await externalIntegration.declareEnergyCalendars(service)).to.deep.equal([
        'calendar "agile-gb": granularity conflict',
      ]);
      // an integration without the capability declares nothing
      const other = await seedExternalService({ selector: 'ext-dev-other', name: 'ext-dev-other' });
      expect(await externalIntegration.declareEnergyCalendars(other)).to.deep.equal([]);
    });

    it('should publish and read a declared calendar, refuse an undeclared key', async () => {
      const { externalIntegration, energyContract } = buildSupervisor();
      const service = await seedEnergyService();
      energyContract.publishCalendarEntries = fake.resolves({
        count: 1,
        changed_from: new Date('2026-01-12T00:00:00Z'),
      });
      const entries = [{ starts_at: '2026-01-12T00:00:00Z', value: 'cap' }];
      const result = await externalIntegration.publishEnergyCalendar(service, { calendar_key: 'agile-gb', entries });
      expect(result.count).to.equal(1);
      sinonAssert.calledWith(energyContract.publishCalendarEntries, 'agile-gb', entries, {
        provider_service_id: service.id,
      });
      await expect(
        externalIntegration.publishEnergyCalendar(service, { calendar_key: 'tempo', entries }),
      ).to.be.rejectedWith(ForbiddenError, 'calendar "tempo" is not declared by this integration');
      await expect(externalIntegration.publishEnergyCalendar(service, null)).to.be.rejectedWith(
        BadParameters,
        'calendar_key',
      );
      await expect(externalIntegration.publishEnergyCalendar(service, { entries })).to.be.rejectedWith(
        BadParameters,
        'calendar_key',
      );
      energyContract.getCalendarEntries = fake.resolves(entries);
      expect(await externalIntegration.getEnergyCalendar(service, 'agile-gb', { from: '2026-01-01' })).to.deep.equal(
        entries,
      );
      sinonAssert.calledWith(energyContract.getCalendarEntries, 'agile-gb', { from: '2026-01-01' });
      await expect(externalIntegration.getEnergyCalendar(service, 'tempo')).to.be.rejectedWith(ForbiddenError);
    });

    it('should list the contracts of the integration without the meter', async () => {
      const { externalIntegration, energyContract } = buildSupervisor();
      const service = await seedEnergyService();
      energyContract.get = fake.resolves([
        {
          id: 'c1',
          template_key: 'agile',
          template_version: '1',
          pricing_mode: 'delegated',
          inputs: null,
          valid_from: '2026-01-01',
          valid_to: null,
          timezone: 'Europe/London',
          currency: 'GBP',
          billing_period_start_day: 1,
          status: 'active',
          electric_meter_device_id: 'secret-meter',
          tariff: {},
        },
      ]);
      const contracts = await externalIntegration.getEnergyContracts(service);
      sinonAssert.calledWith(energyContract.get, { provider_service_id: service.id });
      expect(contracts).to.deep.equal([
        {
          id: 'c1',
          template_key: 'agile',
          template_version: '1',
          pricing_mode: 'delegated',
          inputs: {},
          valid_from: '2026-01-01',
          valid_to: null,
          timezone: 'Europe/London',
          currency: 'GBP',
          billing_period_start_day: 1,
          status: 'active',
        },
      ]);
    });

    it('should turn a refresh nudge into a bounded recalculation, once per minute', async () => {
      const { externalIntegration, energyContract } = buildSupervisor();
      const service = await seedEnergyService();
      await externalIntegration.handleEnergyCalendarRefresh(service);
      expect(energyContract.requestCalendarRecalculation.callCount).to.equal(1);
      const [key, from] = energyContract.requestCalendarRecalculation.firstCall.args;
      expect(key).to.equal('agile-gb');
      expect(from.getTime()).to.be.closeTo(Date.now() - 2 * 24 * 60 * 60 * 1000, 5000);
      await externalIntegration.handleEnergyCalendarRefresh(service);
      expect(energyContract.requestCalendarRecalculation.callCount).to.equal(1);
      externalIntegration.energyCalendarRefreshTimes.set(
        service.id,
        Date.now() - ENERGY_CALENDAR_REFRESH_MIN_INTERVAL_MS - 1,
      );
      await externalIntegration.handleEnergyCalendarRefresh(service);
      expect(energyContract.requestCalendarRecalculation.callCount).to.equal(2);
      // an integration without calendars is ignored
      const other = await seedExternalService({ selector: 'ext-dev-other', name: 'ext-dev-other' });
      await externalIntegration.handleEnergyCalendarRefresh(other);
      expect(energyContract.requestCalendarRecalculation.callCount).to.equal(2);
    });
  });
});
