const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const {
  normalizeEnergyDayTypes,
} = require('../../../lib/external-integration/externalIntegration.normalizeEnergyDayTypes');
const {
  ENERGY_CALENDAR_GET_TIMEOUT_MS,
  MAX_ENERGY_CALENDAR_DAYS,
} = require('../../../lib/external-integration/constants');
const { buildSupervisor, seedExternalService, TEST_ENERGY_CALENDAR_MANIFEST } = require('./testUtils.test');

const seedEnergyCalendarService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_ENERGY_CALENDAR_MANIFEST, ...overrides });

const RANGE = { start_date: '2026-09-01', end_date: '2026-09-30' };

describe('externalIntegration energy calendar proxy capability', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should expose energyCalendar.getDayTypes on energy-calendar integrations only', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const calendarService = await seedEnergyCalendarService();
    externalIntegration.registerProxyService(calendarService);
    const calendarProxy = stateManager.get('service', calendarService.name);
    expect(calendarProxy.energyCalendar).to.be.an('object');
    expect(calendarProxy.energyCalendar.getDayTypes).to.be.a('function');
    const deviceService = await seedExternalService({
      name: 'ext-dev-device-demo',
      selector: 'ext-dev-device-demo',
    });
    externalIntegration.registerProxyService(deviceService);
    const deviceProxy = stateManager.get('service', deviceService.name);
    expect(deviceProxy.energyCalendar).to.equal(undefined);
  });

  it('should relay getDayTypes over websocket and normalize the payload', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedEnergyCalendarService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake.resolves({
      success: true,
      data: { day_types: { '2026-09-05': 'weekend', '2026-09-07': 'weekday', 'not-a-date': 'weekend' } },
    });
    const proxyService = stateManager.get('service', service.name);
    const dayTypes = await proxyService.energyCalendar.getDayTypes(RANGE);
    sinonAssert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.ENERGY_CALENDAR_GET_DAY_TYPES,
      { options: { start_date: '2026-09-01', end_date: '2026-09-30' } },
      { timeoutMs: ENERGY_CALENDAR_GET_TIMEOUT_MS },
    );
    expect(dayTypes).to.be.instanceOf(Map);
    expect(Array.from(dayTypes.entries())).to.deep.equal([
      ['2026-09-05', 'weekend'],
      ['2026-09-07', 'weekday'],
    ]);
  });

  it('should fail on a command result without a day types payload', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedEnergyCalendarService();
    externalIntegration.registerProxyService(service);
    externalIntegration.sendCommand = fake.resolves({ success: true, data: {} });
    const proxyService = stateManager.get('service', service.name);
    await expect(proxyService.energyCalendar.getDayTypes(RANGE)).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
    );
  });
});

describe('externalIntegration.normalizeEnergyDayTypes', () => {
  it('should keep valid entries only', () => {
    const dayTypes = normalizeEnergyDayTypes(
      {
        '2026-09-05': 'weekend',
        '2026-09-06': 'weekend',
        '2026-09-07': 'weekday',
        // invalid dates
        '2026-09-31': 'weekend',
        '2026/09/08': 'weekday',
        // outside the requested range
        '2026-08-31': 'weekday',
        '2026-10-01': 'weekday',
        // invalid day types
        '2026-09-09': 'Week End',
        '2026-09-10': 42,
        '2026-09-11': '-weekend',
        '2026-09-12': 'a'.repeat(33),
      },
      RANGE,
    );
    expect(Array.from(dayTypes.entries())).to.deep.equal([
      ['2026-09-05', 'weekend'],
      ['2026-09-06', 'weekend'],
      ['2026-09-07', 'weekday'],
    ]);
  });

  it('should reject a payload that is not a plain object', () => {
    expect(() => normalizeEnergyDayTypes(undefined, RANGE)).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeEnergyDayTypes(null, RANGE)).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeEnergyDayTypes('weekend', RANGE)).to.throw(ExternalIntegrationUnavailableError);
    expect(() => normalizeEnergyDayTypes(['2026-09-05'], RANGE)).to.throw(ExternalIntegrationUnavailableError);
  });

  it('should cap the number of entries', () => {
    const payload = {};
    const start = new Date('2000-01-01T00:00:00.000Z');
    for (let i = 0; i < MAX_ENERGY_CALENDAR_DAYS + 10; i += 1) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      payload[date] = 'weekday';
    }
    const dayTypes = normalizeEnergyDayTypes(payload, { start_date: '2000-01-01', end_date: '2030-01-01' });
    expect(dayTypes.size).to.equal(MAX_ENERGY_CALENDAR_DAYS);
  });
});
