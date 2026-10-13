const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const {
  scheduleBoundedRecalculation,
  RECALCULATION_MIN_INTERVAL_MS,
} = require('../../../../lib/energy-contract/recalculation.schedule');

describe('energyContract: bounded recalculation scheduler', () => {
  let clock;
  let states;
  beforeEach(() => {
    clock = sinon.useFakeTimers({ now: new Date('2026-01-12T12:00:00Z').getTime(), toFake: ['setTimeout', 'Date'] });
    states = new Map();
  });
  afterEach(() => {
    states.forEach((state) => clearTimeout(state.timer));
    sinon.restore();
  });

  it('should keep the instant of a failed run and retry it after the cooldown', async () => {
    const run = sinon.stub();
    run.onFirstCall().rejects(new Error('db down'));
    run.onSecondCall().resolves(null);
    const from = new Date('2026-01-12T05:30:00Z');
    await expect(scheduleBoundedRecalculation(states, 'meter', from, run)).to.be.rejectedWith('db down');
    const state = states.get('meter');
    expect(state.from).to.deep.equal(from);
    expect(state.timer).to.not.equal(null);
    await clock.tickAsync(RECALCULATION_MIN_INTERVAL_MS);
    expect(run.callCount).to.equal(2);
    expect(run.secondCall.args[0]).to.deep.equal(from);
    expect(state.from).to.equal(null);
    expect(state.timer).to.equal(null);
  });

  it('should merge the requests received during a failed run, keeping the earliest, and log a failed retry', async () => {
    const earlier = new Date('2026-01-10T05:30:00Z');
    const later = new Date('2026-01-14T05:30:00Z');
    const run = sinon.stub();
    // a request arriving while the run is in flight: the pending instant is set again
    run.onFirstCall().callsFake(async () => {
      await scheduleBoundedRecalculation(states, 'meter', later, run);
      throw new Error('db down');
    });
    run.onSecondCall().callsFake(async () => {
      await scheduleBoundedRecalculation(states, 'meter', earlier, run);
      throw new Error('still down');
    });
    run.onThirdCall().rejects(new Error('down again'));
    await expect(
      scheduleBoundedRecalculation(states, 'meter', new Date('2026-01-12T05:30:00Z'), run),
    ).to.be.rejectedWith('db down');
    const state = states.get('meter');
    // the failed instant is earlier than the one received meanwhile
    expect(state.from).to.deep.equal(new Date('2026-01-12T05:30:00Z'));
    await clock.tickAsync(RECALCULATION_MIN_INTERVAL_MS);
    expect(run.callCount).to.equal(2);
    // the instant received meanwhile is earlier than the failed one
    expect(state.from).to.deep.equal(earlier);
    // the deferred retry fails too: logged, re-armed
    await clock.tickAsync(RECALCULATION_MIN_INTERVAL_MS);
    expect(run.callCount).to.equal(3);
    expect(state.from).to.deep.equal(earlier);
    expect(state.timer).to.not.equal(null);
  });
});
