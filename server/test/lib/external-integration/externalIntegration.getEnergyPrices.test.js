const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const { BadParameters, ForbiddenError, NotFoundError, TooManyRequests } = require('../../../utils/coreErrors');
const { MAX_ENERGY_PRICE_READS_PER_MINUTE } = require('../../../lib/external-integration/constants');
const { buildSupervisor, TEST_MANIFEST } = require('./testUtils.test');

const NOW = new Date('2026-10-17T12:00:00Z').getTime();
const SERVICE = { id: 'service-id', selector: 'ext-zendure', manifest: { ...TEST_MANIFEST, energy_prices: true } };
const DEVICE_EXTERNAL_ID = 'ext:ext-zendure:battery';
const PRICES = { currency: 'EUR', slots: [] };

describe('externalIntegration.getEnergyPrices', () => {
  let externalIntegration;
  let energyContract;
  let stateManager;

  const query = (overrides = {}) => ({
    device_external_id: DEVICE_EXTERNAL_ID,
    from: '2026-10-17T12:00:00Z',
    to: '2026-10-18T12:00:00Z',
    ...overrides,
  });
  const expectRejected = async (promise, ErrorClass, message) => {
    try {
      await promise;
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ErrorClass);
      expect(e.message).to.include(message);
    }
  };

  beforeEach(() => {
    sinon.useFakeTimers({ now: NOW, toFake: ['Date'] });
    ({ externalIntegration, energyContract, stateManager } = buildSupervisor());
    energyContract.getDeviceElectricMeterId = fake.resolves('meter-id');
    energyContract.getMeterPrices = fake.resolves(PRICES);
    stateManager.setState('deviceByExternalId', DEVICE_EXTERNAL_ID, {
      id: 'battery-id',
      service_id: SERVICE.id,
      external_id: DEVICE_EXTERNAL_ID,
      features: [],
    });
  });
  afterEach(() => sinon.restore());

  it("should return the prices of the device's root meter over the window", async () => {
    const result = await externalIntegration.getEnergyPrices(SERVICE, query());
    expect(result).to.equal(PRICES);
    expect(energyContract.getDeviceElectricMeterId.firstCall.args[0]).to.include({ id: 'battery-id' });
    expect(energyContract.getMeterPrices.firstCall.args).to.deep.equal([
      'meter-id',
      { from: NOW, to: NOW + 24 * 60 * 60 * 1000 },
    ]);
  });

  it('should accept the widest window: 7 days, from one year ago, up to 48 hours ahead', async () => {
    await externalIntegration.getEnergyPrices(
      SERVICE,
      query({ from: '2025-10-17T12:00:00Z', to: '2025-10-24T12:00:00Z' }),
    );
    await externalIntegration.getEnergyPrices(
      SERVICE,
      query({ from: '2026-10-12T12:00:00Z', to: '2026-10-19T12:00:00Z' }),
    );
    expect(energyContract.getMeterPrices.callCount).to.equal(2);
  });

  it('should read an explicit offset and fractional seconds', async () => {
    await externalIntegration.getEnergyPrices(
      SERVICE,
      query({ from: '2026-10-17T14:00+02:00', to: '2026-10-18T07:00:00.500-05:00' }),
    );
    expect(energyContract.getMeterPrices.firstCall.args[1]).to.deep.equal({
      from: NOW,
      to: NOW + 24 * 60 * 60 * 1000 + 500,
    });
  });

  it('should refuse an integration not declaring energy_prices: true', async () => {
    const forbidden = (service) =>
      expectRejected(externalIntegration.getEnergyPrices(service, query()), ForbiddenError, 'energy_prices');
    await forbidden({ ...SERVICE, manifest: TEST_MANIFEST });
    await forbidden({ ...SERVICE, manifest: { ...TEST_MANIFEST, energy_prices: false } });
    // validateManifest rejects it at install, the gate only opens on an explicit true
    await forbidden({ ...SERVICE, manifest: { ...TEST_MANIFEST, energy_prices: 'true' } });
    await forbidden({ id: 'no-manifest' });
    expect(energyContract.getMeterPrices.callCount).to.equal(0);
  });

  it('should refuse an invalid query', async () => {
    const invalid = (overrides, message) =>
      expectRejected(externalIntegration.getEnergyPrices(SERVICE, query(overrides)), BadParameters, message);
    await invalid({ device_external_id: undefined }, 'device_external_id: must be a non-empty string');
    await invalid({ device_external_id: '' }, 'device_external_id: must be a non-empty string');
    await invalid({ from: undefined }, 'from: must be an ISO date');
    await invalid({ from: 'yesterday' }, 'from: must be an ISO date');
    await invalid({ to: '' }, 'to: must be an ISO date');
    // Date.parse alone would read these in the timezone of the host, or accept them loosely
    await invalid({ from: '2026-10-17T12:00:00' }, 'from: must be an ISO date');
    await invalid({ from: '2026-10-17' }, 'from: must be an ISO date');
    await invalid({ to: '1' }, 'to: must be an ISO date');
    await invalid({ to: 'Sun Oct 18 2026 12:00:00 GMT+0000' }, 'to: must be an ISO date');
    await invalid({ to: '2026-10-17T12:00:00Z' }, 'to: must be after from');
    await invalid({ from: '2026-10-10T12:00:00Z', to: '2026-10-17T12:00:01Z' }, 'to: the window is at most 7 days');
    await invalid({ from: '2025-10-17T11:59:59Z', to: '2025-10-18T12:00:00Z' }, 'from: must be at most one year ago');
    await invalid({ to: '2026-10-19T12:00:01Z' }, 'to: must be at most 48 hours ahead');
    // the default query object of a direct call
    await expectRejected(externalIntegration.getEnergyPrices(SERVICE), BadParameters, 'device_external_id');
  });

  it('should answer 404 on a device that is unknown or belongs to another integration', async () => {
    await expectRejected(
      externalIntegration.getEnergyPrices(SERVICE, query({ device_external_id: 'ext:ext-zendure:unknown' })),
      NotFoundError,
      'DEVICE_NOT_FOUND',
    );
    stateManager.setState('deviceByExternalId', 'ext:other:battery', { id: 'other', service_id: 'other-service' });
    await expectRejected(
      externalIntegration.getEnergyPrices(SERVICE, query({ device_external_id: 'ext:other:battery' })),
      NotFoundError,
      'DEVICE_NOT_FOUND',
    );
    expect(energyContract.getDeviceElectricMeterId.callCount).to.equal(0);
  });

  it('should answer 404 on a device that is not on an electric meter', async () => {
    energyContract.getDeviceElectricMeterId = fake.resolves(null);
    await expectRejected(
      externalIntegration.getEnergyPrices(SERVICE, query()),
      NotFoundError,
      'DEVICE_NOT_ON_ELECTRIC_METER',
    );
    expect(energyContract.getMeterPrices.callCount).to.equal(0);
  });

  it('should rate limit the reads per integration and reset the counter after a minute', async () => {
    for (let i = 0; i < MAX_ENERGY_PRICE_READS_PER_MINUTE; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await externalIntegration.getEnergyPrices(SERVICE, query());
    }
    try {
      await externalIntegration.getEnergyPrices(SERVICE, query());
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(TooManyRequests);
      expect(e.message).to.include('RATE_LIMIT_EXCEEDED');
      expect(e.timeBeforeNext).to.equal(60);
    }
    // another integration has its own counter
    await externalIntegration
      .getEnergyPrices({ ...SERVICE, id: 'other-service' }, query({ device_external_id: '' }))
      .catch((e) => expect(e).to.be.instanceOf(BadParameters));
    externalIntegration.energyPriceRateLimits.get(SERVICE.id).resetAt = Date.now();
    expect(await externalIntegration.getEnergyPrices(SERVICE, query())).to.equal(PRICES);
  });
});
