const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const {
  buildManager,
  contractPayload,
  BASE_TARIFF,
  TEMPO_TARIFF,
  TEST_SERVICE_ID,
  METER_DEVICE_ID,
} = require('./helpers');
const { EVENTS } = require('../../../../utils/constants');

describe('energyContract.checkPriceChanges', () => {
  let energyContract;
  let event;
  let clock;
  beforeEach(async () => {
    ({ energyContract, event } = await buildManager({ timezone: 'UTC' }));
    clock = sinon.useFakeTimers({ now: new Date('2026-01-12T12:40:00Z'), toFake: ['Date'] });
  });
  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should only record the first observation, then emit a trigger check when the price changes', async () => {
    await energyContract.declareCalendar(
      { key: 'tempo', granularity: 'day', values: ['blue', 'white', 'red'] },
      TEST_SERVICE_ID,
    );
    await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-12', value: 'blue' }], {
      provider_service_id: TEST_SERVICE_ID,
      skip_recalculation: true,
    });
    const contract = await energyContract.create(
      contractPayload({ name: 'Tempo', tariff: TEMPO_TARIFF, timezone: 'UTC', valid_from: '2026-01-01' }),
    );
    const emit = sinon.spy(event, 'emit');
    // first observation: recorded, nothing emitted
    const first = await energyContract.checkPriceChanges();
    expect(first).to.deep.equal([]);
    // kept per meter, not per contract
    expect(energyContract.lastKnownPrices.get(contract.electric_meter_device_id)).to.deep.equal({
      price: 0.1609,
      label: 'Blue peak',
    });
    expect(emit.callCount).to.equal(0);
    // same price: nothing emitted
    const same = await energyContract.checkPriceChanges();
    expect(same).to.deep.equal([]);
    expect(emit.callCount).to.equal(0);
    // 22:00 UTC: blue off-peak
    clock.setSystemTime(new Date('2026-01-12T22:10:00Z'));
    const changed = await energyContract.checkPriceChanges();
    expect(changed).to.deep.equal([
      {
        type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
        electric_meter: 'electrical-meter',
        contract: 'tempo',
        meter_contracts: ['tempo'],
        price: 0.1296,
        previous_price: 0.1609,
        label: 'Blue off-peak',
        previous_label: 'Blue peak',
        currency: 'EUR',
      },
    ]);
    expect(emit.callCount).to.equal(1);
    expect(emit.firstCall.args[0]).to.equal(EVENTS.TRIGGERS.CHECK);
    expect(emit.firstCall.args[1]).to.deep.equal(changed[0]);
    expect(energyContract.lastKnownPrices.get(METER_DEVICE_ID)).to.deep.equal({
      price: 0.1296,
      label: 'Blue off-peak',
    });
  });

  it('should emit when only the label changes and normalise missing values to null', async () => {
    const contract = await energyContract.create(contractPayload({ timezone: 'UTC', valid_from: '2026-01-01' }));
    const getCurrent = sinon.stub(energyContract, 'getCurrent');
    getCurrent.onCall(0).resolves({ price: 0.2, currency: 'EUR' });
    getCurrent.onCall(1).resolves({ price: 0.2, label: 'peak', currency: 'EUR' });
    getCurrent.onCall(2).resolves({ label: 'peak', currency: 'EUR' });
    await energyContract.checkPriceChanges();
    expect(energyContract.lastKnownPrices.get(contract.electric_meter_device_id)).to.deep.equal({
      price: 0.2,
      label: null,
    });
    const labelChanged = await energyContract.checkPriceChanges();
    expect(labelChanged).to.have.lengthOf(1);
    expect(labelChanged[0]).to.include({ price: 0.2, previous_price: 0.2, label: 'peak', previous_label: null });
    const priceUnknown = await energyContract.checkPriceChanges();
    expect(priceUnknown).to.have.lengthOf(1);
    expect(priceUnknown[0]).to.include({ price: null, previous_price: 0.2, label: 'peak', previous_label: 'peak' });
  });

  it('should fire the trigger at a quarter hour for a spot price changing every 15 minutes', async () => {
    await energyContract.declareCalendar(
      { key: 'spot-fi', granularity: 'fifteen_minutes', timezone: 'UTC', currency: 'EUR' },
      TEST_SERVICE_ID,
    );
    await energyContract.publishCalendarEntries(
      'spot-fi',
      [
        { starts_at: '2026-01-12T12:30:00Z', price: 0.1 },
        { starts_at: '2026-01-12T12:45:00Z', price: 0.3 },
      ],
      { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
    );
    await energyContract.create(
      contractPayload({
        name: 'Spot FI',
        timezone: 'UTC',
        valid_from: '2026-01-01',
        tariff: {
          tariff_version: 1,
          calendars: ['spot-fi'],
          components: [
            {
              key: 'energy',
              kind: 'consumption',
              rules: [{ label: 'Spot', price_from_calendar: 'spot-fi' }],
              fallback: { label: 'Backup', price: 0.2 },
            },
          ],
        },
      }),
    );
    const quarterHour = { calendar_granularity: 'fifteen_minutes' };
    expect(await energyContract.checkPriceChanges(quarterHour)).to.deep.equal([]);
    // 12:45: the next quarter, between two runs of the 30-minute job
    clock.setSystemTime(new Date('2026-01-12T12:45:00Z'));
    const changed = await energyContract.checkPriceChanges(quarterHour);
    expect(changed).to.have.lengthOf(1);
    expect(changed[0]).to.include({ contract: 'spot-fi', price: 0.3, previous_price: 0.1, label: 'Spot' });
  });

  it('should only check the contracts reading a calendar of the requested granularity', async () => {
    await energyContract.declareCalendar({ key: 'spot-fi', granularity: 'fifteen_minutes' }, TEST_SERVICE_ID);
    await energyContract.declareCalendar({ key: 'spot-fr', granularity: 'thirty_minutes' }, TEST_SERVICE_ID);
    // several meters with an active contract each (listed through a stub)
    sinon.stub(energyContract, 'get').resolves([
      {
        id: 'quarter-id',
        selector: 'quarter',
        status: 'active',
        electric_meter_device_id: 'meter-1',
        tariff: { calendars: ['tempo', 'spot-fi'] },
      },
      {
        id: 'half-hour-id',
        selector: 'half-hour',
        status: 'active',
        electric_meter_device_id: 'meter-2',
        tariff: { calendars: ['spot-fr'] },
      },
      // a delegated contract without fixed fees stores a tariff without calendars
      {
        id: 'delegated-id',
        selector: 'delegated',
        status: 'active',
        electric_meter_device_id: 'meter-3',
        tariff: { tariff_version: 1, components: [] },
      },
    ]);
    const getCurrent = sinon.stub(energyContract, 'getCurrent').resolves({ price: 0.1, label: 'a', currency: 'EUR' });
    await energyContract.checkPriceChanges({ calendar_granularity: 'fifteen_minutes' });
    expect(getCurrent.args).to.deep.equal([['quarter']]);
    // the 30-minute job checks them all
    await energyContract.checkPriceChanges();
    expect(getCurrent.callCount).to.equal(4);
  });

  it('should skip the contracts that are not active', async () => {
    await energyContract.create(contractPayload({ name: 'Expired', valid_from: '2020-01-01', valid_to: '2020-12-31' }));
    await energyContract.create(contractPayload({ name: 'Scheduled', valid_from: '2030-01-01' }));
    const getCurrent = sinon.spy(energyContract, 'getCurrent');
    const emitted = await energyContract.checkPriceChanges();
    expect(emitted).to.deep.equal([]);
    expect(getCurrent.callCount).to.equal(0);
    expect(energyContract.lastKnownPrices.size).to.equal(0);
  });

  it('should follow the meter across a tariff change: the successor compares with the expired contract', async () => {
    // the tariff changed on 12 January: contract A ended on the 11th, contract B started on the 12th
    await energyContract.create(
      contractPayload({ name: 'Tariff A', timezone: 'UTC', valid_from: '2025-01-01', valid_to: '2026-01-11' }),
    );
    await energyContract.create(
      contractPayload({
        name: 'Tariff B',
        timezone: 'UTC',
        valid_from: '2026-01-12',
        tariff: { ...BASE_TARIFF, components: [{ ...BASE_TARIFF.components[0], fallback: { price: 0.25 } }] },
      }),
    );
    // the last observation on the 11th was contract A's price
    clock.setSystemTime(new Date('2026-01-11T23:40:00Z'));
    expect(await energyContract.checkPriceChanges()).to.deep.equal([]);
    expect(energyContract.lastKnownPrices.get(METER_DEVICE_ID)).to.deep.equal({ price: 0.2, label: null });
    // on the 12th, contract B is the active one: its price is a price change of the meter
    clock.setSystemTime(new Date('2026-01-12T00:10:00Z'));
    const changed = await energyContract.checkPriceChanges();
    expect(changed).to.deep.equal([
      {
        type: EVENTS.ENERGY_CONTRACT.PRICE_CHANGED,
        electric_meter: 'electrical-meter',
        contract: 'tariff-b',
        meter_contracts: ['tariff-b', 'tariff-a'],
        price: 0.25,
        previous_price: 0.2,
        label: null,
        previous_label: null,
        currency: 'EUR',
      },
    ]);
    expect(energyContract.lastKnownPrices.size).to.equal(1);
  });

  it('should log and continue when one contract fails', async () => {
    // two meters with an active contract each (listed through a stub)
    const fine = {
      id: 'fine-id',
      selector: 'fine',
      status: 'active',
      electric_meter_device_id: 'fine-meter-id',
      electric_meter_device: { id: 'fine-meter-id', selector: 'fine-meter', name: 'Fine meter' },
    };
    sinon
      .stub(energyContract, 'get')
      .resolves([
        { id: 'broken-id', selector: 'broken', status: 'active', electric_meter_device_id: 'broken-meter-id' },
        fine,
      ]);
    const getCurrent = sinon.stub(energyContract, 'getCurrent');
    getCurrent.withArgs('broken').rejects(new Error('boom'));
    getCurrent
      .withArgs('fine')
      .onFirstCall()
      .resolves({ price: 0.1, label: 'a', currency: 'EUR' });
    getCurrent
      .withArgs('fine')
      .onSecondCall()
      .resolves({ price: 0.3, label: 'a', currency: 'EUR' });
    await energyContract.checkPriceChanges();
    const emitted = await energyContract.checkPriceChanges();
    expect(emitted).to.have.lengthOf(1);
    expect(emitted[0]).to.include({ electric_meter: 'fine-meter', contract: 'fine', price: 0.3, previous_price: 0.1 });
    expect(emitted[0].meter_contracts).to.deep.equal(['fine']);
    expect(energyContract.lastKnownPrices.has(fine.electric_meter_device_id)).to.equal(true);
    expect(energyContract.lastKnownPrices.size).to.equal(1);
  });
});
