const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);
const FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

describe('Device.replaceHistoricalStatesFrom', () => {
  let device;
  let stateManager;
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    stateManager = {
      get: fake.returns({ id: FEATURE_ID, selector: 'test-device-feature' }),
    };
    device = new Device(event, {}, stateManager, {}, {}, {}, job);
    device.saveHistoricalState = fake.resolves(null);
    await db.duckDbBatchInsertState(FEATURE_ID, [
      { value: 1, created_at: new Date('2026-01-01T00:00:00.000Z') },
      { value: 2, created_at: new Date('2026-01-01T01:00:00.000Z') },
    ]);
  });
  afterEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    sinon.restore();
  });

  it('should replace the states from the date and refresh the last value', async () => {
    await device.replaceHistoricalStatesFrom(FEATURE_ID, new Date('2026-01-01T01:00:00.000Z'), [
      { value: 30, created_at: '2026-01-01T02:00:00.000Z' },
      { value: 20, created_at: '2026-01-01T01:00:00.000Z' },
    ]);
    const rows = await db.duckDbReadConnectionAllAsync(
      'SELECT value FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      FEATURE_ID,
    );
    expect(rows.map((row) => row.value)).to.deep.equal([1, 20, 30]);
    // the most recent state is the one propagated
    expect(device.saveHistoricalState.callCount).to.equal(1);
    expect(device.saveHistoricalState.firstCall.args[1]).to.equal(30);
  });

  it('should only empty the window without state, and reject an invalid state', async () => {
    await device.replaceHistoricalStatesFrom(FEATURE_ID, new Date('2026-01-01T01:00:00.000Z'), []);
    const rows = await db.duckDbReadConnectionAllAsync(
      'SELECT value FROM t_device_feature_state WHERE device_feature_id = ?',
      FEATURE_ID,
    );
    expect(rows.map((row) => row.value)).to.deep.equal([1]);
    expect(device.saveHistoricalState.callCount).to.equal(0);
    await expect(
      device.replaceHistoricalStatesFrom(FEATURE_ID, new Date(), [{ value: 'x', created_at: 'nope' }]),
    ).to.be.rejectedWith('"value" must be a number');
  });
});
