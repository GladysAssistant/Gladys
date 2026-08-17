const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const DEVICE_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

const buildDeviceInstance = () => {
  const variable = {
    getValue: fake.resolves(null),
  };
  const stateManager = {
    get: fake.returns(null),
    setState: fake.returns(null),
  };
  return new Device(event, {}, stateManager, {}, {}, variable, job);
};

describe('Device.getDeviceFeatureStatesPaginated', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });

  it('should return a page of states, most recent first', async () => {
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T15:01:00.000Z') },
      { value: 3, created_at: new Date('2025-08-28T15:02:00.000Z') },
    ]);
    const deviceInstance = buildDeviceInstance();
    const result = await deviceInstance.getDeviceFeatureStatesPaginated('test-device-feature', {
      from: '2025-08-28T15:00:00.000Z',
      to: '2025-08-28T15:02:00.000Z',
      take: 2,
    });
    expect(result).to.have.property('total', 3);
    expect(result).to.have.property('take', 2);
    expect(result).to.have.property('skip', 0);
    expect(result.states).to.deep.equal([
      { created_at: new Date('2025-08-28T15:02:00.000Z'), value: 3 },
      { created_at: new Date('2025-08-28T15:01:00.000Z'), value: 2 },
    ]);
  });

  it('should return the second page of states', async () => {
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T15:01:00.000Z') },
      { value: 3, created_at: new Date('2025-08-28T15:02:00.000Z') },
    ]);
    const deviceInstance = buildDeviceInstance();
    const result = await deviceInstance.getDeviceFeatureStatesPaginated('test-device-feature', {
      from: '2025-08-28T15:00:00.000Z',
      to: '2025-08-28T15:02:00.000Z',
      take: '2',
      skip: '2',
    });
    expect(result).to.have.property('total', 3);
    expect(result).to.have.property('skip', 2);
    expect(result.states).to.deep.equal([{ created_at: new Date('2025-08-28T15:00:00.000Z'), value: 1 }]);
  });

  it('should default to the last 7 days when no date is given', async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 12, created_at: twoMonthsAgo },
      { value: 42, created_at: oneDayAgo },
    ]);
    const deviceInstance = buildDeviceInstance();
    const result = await deviceInstance.getDeviceFeatureStatesPaginated('test-device-feature');
    expect(result).to.have.property('total', 1);
    expect(result).to.have.property('take', 100);
    expect(result.states).to.have.lengthOf(1);
    expect(result.states[0]).to.have.property('value', 42);
  });

  it('should cap the number of states returned', async () => {
    const deviceInstance = buildDeviceInstance();
    const result = await deviceInstance.getDeviceFeatureStatesPaginated('test-device-feature', {
      take: 100000,
      skip: -10,
    });
    expect(result).to.have.property('take', 500);
    expect(result).to.have.property('skip', 0);
    expect(result.states).to.deep.equal([]);
  });

  it('should throw NotFoundError when device feature does not exist', async () => {
    const deviceInstance = buildDeviceInstance();
    const promise = deviceInstance.getDeviceFeatureStatesPaginated('non-existent-feature');
    await assert.isRejected(promise, 'DeviceFeature not found');
  });

  it('should throw BadParameters when "to" is invalid', async () => {
    const deviceInstance = buildDeviceInstance();
    const promise = deviceInstance.getDeviceFeatureStatesPaginated('test-device-feature', { to: 'not-a-date' });
    await assert.isRejected(promise, 'Invalid "to" date: not-a-date');
  });

  it('should throw BadParameters when "from" is invalid', async () => {
    const deviceInstance = buildDeviceInstance();
    const promise = deviceInstance.getDeviceFeatureStatesPaginated('test-device-feature', { from: 'not-a-date' });
    await assert.isRejected(promise, 'Invalid "from" date: not-a-date');
  });
});
