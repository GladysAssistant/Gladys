const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const EnergyCalendar = require('../../../lib/energy-calendar');
const { ServiceNotConfiguredError, BadParameters } = require('../../../utils/coreErrors');
const { MAX_ENERGY_CALENDAR_DAYS } = require('../../../lib/external-integration/constants');

const RANGE = { start_date: '2026-09-01', end_date: '2026-09-30' };
const DAY_TYPES = new Map([
  ['2026-09-05', 'weekend'],
  ['2026-09-07', 'weekday'],
]);

/**
 * @description Build a service manager mock over a map of services.
 * @param {object} services - Map of service name to service object.
 * @returns {object} The service manager mock.
 * @example
 * buildServiceManager({ 'ext-calendar': { energyCalendar: { getDayTypes: fake.resolves(new Map()) } } });
 */
function buildServiceManager(services) {
  return {
    getService: (name) => (services[name] === undefined ? null : services[name]),
    stateManager: {
      getAllKeys: () => Object.keys(services),
    },
  };
}

describe('energyCalendar.getDayTypes', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should get the day types from the only provider', async () => {
    const provider = { energyCalendar: { getDayTypes: fake.resolves(DAY_TYPES) } };
    const energyCalendar = new EnergyCalendar(buildServiceManager({ 'ext-french-calendar': provider }));
    const result = await energyCalendar.getDayTypes(RANGE);
    expect(result).to.equal(DAY_TYPES);
    assert.calledWith(provider.energyCalendar.getDayTypes, RANGE);
  });

  it('should skip services without the energy calendar capability', async () => {
    const provider = { energyCalendar: { getDayTypes: fake.resolves(DAY_TYPES) } };
    const energyCalendar = new EnergyCalendar(
      buildServiceManager({
        openweather: { weather: { get: fake.resolves({}) } },
        'not-a-service': undefined,
        'ext-french-calendar': provider,
      }),
    );
    const result = await energyCalendar.getDayTypes(RANGE);
    expect(result).to.equal(DAY_TYPES);
  });

  it('should try providers in name order and fall through on failure', async () => {
    const broken = { energyCalendar: { getDayTypes: fake.rejects(new Error('boom')) } };
    const working = { energyCalendar: { getDayTypes: fake.resolves(DAY_TYPES) } };
    const energyCalendar = new EnergyCalendar(
      buildServiceManager({ 'ext-b-calendar': working, 'ext-a-calendar': broken }),
    );
    const result = await energyCalendar.getDayTypes(RANGE);
    expect(result).to.equal(DAY_TYPES);
    assert.calledOnce(broken.energyCalendar.getDayTypes);
    assert.calledOnce(working.energyCalendar.getDayTypes);
  });

  it('should stop at the first working provider', async () => {
    const first = { energyCalendar: { getDayTypes: fake.resolves(DAY_TYPES) } };
    const second = { energyCalendar: { getDayTypes: fake.resolves(new Map()) } };
    const energyCalendar = new EnergyCalendar(
      buildServiceManager({ 'ext-a-calendar': first, 'ext-b-calendar': second }),
    );
    const result = await energyCalendar.getDayTypes(RANGE);
    expect(result).to.equal(DAY_TYPES);
    assert.calledOnce(first.energyCalendar.getDayTypes);
    assert.notCalled(second.energyCalendar.getDayTypes);
  });

  it('should throw ServiceNotConfiguredError when no provider is installed', async () => {
    const energyCalendar = new EnergyCalendar(buildServiceManager({ openweather: { weather: {} } }));
    await expect(energyCalendar.getDayTypes(RANGE)).to.be.rejectedWith(ServiceNotConfiguredError);
  });

  it('should rethrow the first provider error when every provider fails', async () => {
    const first = { energyCalendar: { getDayTypes: fake.rejects(new Error('first')) } };
    const second = { energyCalendar: { getDayTypes: fake.rejects(new Error('second')) } };
    const energyCalendar = new EnergyCalendar(buildServiceManager({ 'ext-a': first, 'ext-b': second }));
    await expect(energyCalendar.getDayTypes(RANGE)).to.be.rejectedWith('first');
  });

  it('should clamp a range longer than the maximum number of days', async () => {
    const provider = { energyCalendar: { getDayTypes: fake.resolves(DAY_TYPES) } };
    const energyCalendar = new EnergyCalendar(buildServiceManager({ 'ext-french-calendar': provider }));
    await energyCalendar.getDayTypes({ start_date: '1990-01-01', end_date: '2026-09-30' });
    const expectedStart = new Date(
      new Date('2026-09-30T00:00:00.000Z').getTime() - (MAX_ENERGY_CALENDAR_DAYS - 1) * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    assert.calledWith(provider.energyCalendar.getDayTypes, { start_date: expectedStart, end_date: '2026-09-30' });
  });

  it('should reject an invalid range', async () => {
    const provider = { energyCalendar: { getDayTypes: fake.resolves(DAY_TYPES) } };
    const energyCalendar = new EnergyCalendar(buildServiceManager({ 'ext-french-calendar': provider }));
    await expect(energyCalendar.getDayTypes()).to.be.rejectedWith(BadParameters);
    await expect(energyCalendar.getDayTypes(null)).to.be.rejectedWith(BadParameters);
    await expect(energyCalendar.getDayTypes({ start_date: '2026-09-31', end_date: '2026-09-30' })).to.be.rejectedWith(
      BadParameters,
    );
    await expect(energyCalendar.getDayTypes({ start_date: '2026-09-01', end_date: 20260930 })).to.be.rejectedWith(
      BadParameters,
    );
    await expect(energyCalendar.getDayTypes({ start_date: '2026-10-01', end_date: '2026-09-30' })).to.be.rejectedWith(
      'start_date: must not be after end_date',
    );
    assert.notCalled(provider.energyCalendar.getDayTypes);
  });
});
