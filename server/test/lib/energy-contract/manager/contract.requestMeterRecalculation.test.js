const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { EVENTS } = require('../../../../utils/constants');
const { buildManager, contractPayload, METER_DEVICE_ID } = require('./helpers');
const { RECALCULATION_MIN_INTERVAL_MS } = require('../../../../lib/energy-contract/recalculation.schedule');
const { waitUntil } = require('../../../helpers/waitUntil');

describe('energyContract.requestMeterRecalculation', () => {
  let energyContract;
  let event;
  beforeEach(async () => {
    ({ energyContract, event } = await buildManager());
  });
  afterEach(() => {
    energyContract.meterRecalculations.forEach((state) => clearTimeout(state.timer));
    sinon.restore();
  });

  it('should queue a recalculation of the meter from the changed instant, bounded to one per 10 minutes', async () => {
    await energyContract.create(contractPayload({ valid_from: '2025-01-01', timezone: 'Europe/Paris' }));
    const emitted = sinon.fake();
    event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, emitted);
    const clearCache = sinon.spy(energyContract, 'clearCurrentPriceCache');
    await energyContract.requestMeterRecalculation(METER_DEVICE_ID, new Date('2026-01-12T05:30:00Z'));
    expect(emitted.callCount).to.equal(1);
    expect(emitted.firstCall.args[0]).to.deep.equal({
      from: new Date('2026-01-12T05:30:00Z'),
      electric_meter_device_ids: [METER_DEVICE_ID],
    });
    expect(clearCache.callCount).to.equal(1);
    // within the window: merged into one deferred run, keeping the earliest instant
    const state = energyContract.meterRecalculations.get(METER_DEVICE_ID);
    // the window ends in 500 ms: room for the three requests below on a loaded CI runner
    state.last_at = Date.now() - RECALCULATION_MIN_INTERVAL_MS + 500;
    await energyContract.requestMeterRecalculation(METER_DEVICE_ID, new Date('2026-01-13T05:30:00Z'));
    // a later instant never pushes the pending one forward
    await energyContract.requestMeterRecalculation(METER_DEVICE_ID, new Date('2026-01-14T05:30:00Z'));
    expect(state.from).to.deep.equal(new Date('2026-01-13T05:30:00Z'));
    await energyContract.requestMeterRecalculation(METER_DEVICE_ID, new Date('2026-01-10T05:30:00Z'));
    expect(emitted.callCount).to.equal(1);
    expect(state.timer).to.not.equal(null);
    // the current price cache is cleared on every request, not when the deferred run starts
    expect(clearCache.callCount).to.equal(4);
    await waitUntil(() => emitted.callCount === 2, { timeout: 3000, message: 'the deferred recalculation' });
    expect(emitted.secondCall.args[0].from.toISOString()).to.equal('2026-01-10T05:30:00.000Z');
    // a backfill before the first contract of the meter: recalculated from the contract start only
    state.last_at = 0;
    await energyContract.requestMeterRecalculation(METER_DEVICE_ID, new Date('2022-06-01T00:00:00Z'));
    expect(emitted.callCount).to.equal(3);
    expect(emitted.thirdCall.args[0].from.toISOString()).to.equal('2024-12-31T23:00:00.000Z');
  });

  it('should queue nothing for a meter without a contract', async () => {
    const emitted = sinon.fake();
    event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, emitted);
    await energyContract.requestMeterRecalculation(METER_DEVICE_ID, new Date('2026-01-12T05:30:00Z'));
    expect(emitted.callCount).to.equal(0);
  });
});
