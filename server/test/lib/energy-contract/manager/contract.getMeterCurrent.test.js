const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { buildManager, contractPayload, BASE_TARIFF, METER_DEVICE_ID } = require('./helpers');
const { NotFoundError } = require('../../../../utils/coreErrors');

const METER = { id: METER_DEVICE_ID, selector: 'electrical-meter', name: 'Electrical Meter' };

// a flat tariff at another price: the successive contract of a tariff change
const tariffAt = (price) => ({
  ...BASE_TARIFF,
  components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { label: `at ${price}`, price } }],
});

describe('energyContract: current price of a meter', () => {
  let energyContract;
  let stateManager;
  beforeEach(async () => {
    ({ energyContract, stateManager } = await buildManager({ timezone: 'UTC' }));
  });
  afterEach(() => {
    sinon.restore();
  });

  /**
   * @description Contract A ended on 31 July 2026, its successor B starts on 1 August 2026 (the
   * tariff change of the field report of issue #3353), both in Europe/Paris.
   * @returns {Promise<Array<object>>} [A, B].
   * @example
   * await createTariffChange();
   */
  async function createTariffChange() {
    const expired = await energyContract.create(
      contractPayload({
        name: 'Tempo 2025',
        timezone: 'Europe/Paris',
        valid_from: '2025-02-01',
        valid_to: '2026-07-31',
        tariff: tariffAt(0.1325),
      }),
    );
    const active = await energyContract.create(
      contractPayload({
        name: 'Tempo 2026',
        timezone: 'Europe/Paris',
        valid_from: '2026-08-01',
        tariff: tariffAt(0.1356),
      }),
    );
    return [expired, active];
  }

  it('should price a meter with its contract active at the instant, never an expired one', async () => {
    await createTariffChange();
    const at = new Date('2026-08-10T12:00:00Z').getTime();
    const current = await energyContract.getMeterCurrent({ electric_meter: 'electrical-meter' }, { at });
    expect(current).to.include({ price: 0.1356, label: 'at 0.1356', currency: 'EUR', unit: 'kWh' });
    expect(current.contract).to.include({ selector: 'tempo-2026', name: 'Tempo 2026' });
    expect(current.electric_meter).to.deep.equal(METER);
    // before the tariff change, the same meter is priced by the previous contract
    const before = await energyContract.getMeterCurrent(
      { electric_meter: 'electrical-meter' },
      { at: new Date('2026-07-10T12:00:00Z').getTime() },
    );
    expect(before).to.include({ price: 0.1325 });
    expect(before.contract.selector).to.equal('tempo-2025');
  });

  it('should judge the validity of each contract on the local date of its own timezone', async () => {
    await createTariffChange();
    // 31 July 22:30 UTC is already 1 August 00:30 in Europe/Paris: contract B
    const current = await energyContract.getMeterCurrent(
      { electric_meter: 'electrical-meter' },
      { at: '2026-07-31T22:30:00Z' },
    );
    expect(current.contract.selector).to.equal('tempo-2026');
    // 21:30 UTC is still 31 July in Europe/Paris: contract A
    const contract = await energyContract.getActiveAt(METER_DEVICE_ID, new Date('2026-07-31T21:30:00Z').getTime());
    expect(contract.selector).to.equal('tempo-2025');
  });

  it('should read a contract selector as the meter of that contract', async () => {
    await createTariffChange();
    const at = new Date('2026-08-10T12:00:00Z').getTime();
    // a widget or a scene saved before the meter targeting names the expired contract
    const current = await energyContract.getMeterCurrent({ energy_contract: 'tempo-2025' }, { at });
    expect(current).to.include({ price: 0.1356 });
    expect(current.contract.selector).to.equal('tempo-2026');
    expect(current.electric_meter).to.deep.equal(METER);
  });

  it('should default to the main meter, the meter of the most recently created consumption contract', async () => {
    expect(await energyContract.getMainElectricMeterDeviceId()).to.equal(null);
    await createTariffChange();
    expect(await energyContract.getMainElectricMeterDeviceId()).to.equal(METER_DEVICE_ID);
    const current = await energyContract.getMeterCurrent({}, { at: new Date('2026-08-10T12:00:00Z').getTime() });
    expect(current).to.include({ price: 0.1356 });
    expect(current.electric_meter).to.deep.equal(METER);
    // a live call without any argument
    const live = await energyContract.getMeterCurrent();
    expect(live.contract.selector).to.equal('tempo-2026');
  });

  it('should answer no contract and no price when the meter has no active contract at the instant', async () => {
    await createTariffChange();
    // before the first contract
    expect(
      await energyContract.getMeterCurrent({ electric_meter: 'electrical-meter' }, { at: '2024-06-01T12:00:00Z' }),
    ).to.deep.equal({ electric_meter: METER, contract: null, price: null });
    // after the last contract
    await energyContract.update('tempo-2026', { valid_to: '2026-08-31' });
    expect(
      await energyContract.getMeterCurrent({ energy_contract: 'tempo-2025' }, { at: '2026-09-02T12:00:00Z' }),
    ).to.deep.equal({ electric_meter: METER, contract: null, price: null });
  });

  it('should answer no meter, no contract and no price when there is no consumption contract at all', async () => {
    expect(await energyContract.getMeterCurrent()).to.deep.equal({ electric_meter: null, contract: null, price: null });
  });

  it('should throw a NotFoundError on an unknown meter or a deleted contract', async () => {
    const unknownMeter = energyContract.getMeterCurrent({ electric_meter: 'unknown-meter' });
    await expect(unknownMeter).to.be.rejectedWith(NotFoundError, 'ELECTRIC_METER_NOT_FOUND');
    const deletedContract = energyContract.getMeterCurrent({ energy_contract: 'deleted-contract' });
    await expect(deletedContract).to.be.rejectedWith(NotFoundError, 'ENERGY_CONTRACT_NOT_FOUND');
  });

  it('should keep the meter id when the meter device is not in the state manager', async () => {
    await createTariffChange();
    const get = stateManager.get.bind(stateManager);
    sinon.stub(stateManager, 'get').callsFake((type, key) => (type === 'deviceById' ? null : get(type, key)));
    const meter = await energyContract.resolveElectricMeter({ energy_contract: 'tempo-2026' });
    expect(meter).to.deep.equal({ id: METER_DEVICE_ID, selector: null, name: null });
  });

  it('should list the contracts with their meter', async () => {
    await createTariffChange();
    const contracts = await energyContract.get();
    expect(contracts.map((contract) => contract.electric_meter_device)).to.deep.equal([METER, METER]);
    const contract = await energyContract.getBySelector('tempo-2025');
    expect(contract.electric_meter_device).to.deep.equal(METER);
  });
});
