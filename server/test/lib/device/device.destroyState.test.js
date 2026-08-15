const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const job = new Job(new EventEmitter());

const DEVICE_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
// The seeded device feature has its last value at this date
const LAST_VALUE_CHANGED = new Date('2019-02-12T07:49:07.556Z');

describe('Device.destroyState', () => {
  let eventManager;
  let stateManager;
  let deviceInstance;

  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    eventManager = {
      on: fake.returns(null),
      emit: fake.returns(null),
    };
    stateManager = {
      get: fake.returns(null),
      setState: fake.returns(null),
    };
    const variable = {
      getValue: fake.resolves(null),
    };
    deviceInstance = new Device(eventManager, {}, stateManager, {}, {}, variable, job);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should destroy one old state without touching the last value', async () => {
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: new Date('2018-01-01T10:00:00.000Z') },
      { value: 2, created_at: new Date('2018-01-01T11:00:00.000Z') },
    ]);

    await deviceInstance.destroyState('test-device-feature', '2018-01-01T10:00:00.000Z');

    const states = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      DEVICE_FEATURE_ID,
    );
    expect(states).to.have.lengthOf(1);
    expect(states[0].value).to.equal(2);
    sinonAssert.notCalled(stateManager.setState);
    sinonAssert.notCalled(eventManager.emit);
  });

  it('should destroy the most recent state and fall back to the previous one', async () => {
    const previousDate = new Date(LAST_VALUE_CHANGED.getTime() - 60 * 1000);
    const newestDate = new Date(LAST_VALUE_CHANGED.getTime() + 60 * 1000);
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: previousDate },
      { value: 9999, created_at: newestDate },
    ]);

    await deviceInstance.destroyState('test-device-feature', newestDate);

    const states = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      DEVICE_FEATURE_ID,
    );
    expect(states).to.have.lengthOf(1);
    const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: 'test-device-feature' } });
    expect(deviceFeature.last_value).to.equal(1);
    expect(new Date(deviceFeature.last_value_changed).getTime()).to.equal(previousDate.getTime());
    sinonAssert.calledWith(eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      payload: {
        device_feature_selector: 'test-device-feature',
        last_value: 1,
        last_value_changed: previousDate,
      },
    });
  });

  it('should fall back to a previous state older than the first time windows', async () => {
    const newestDate = new Date(LAST_VALUE_CHANGED.getTime() + 60 * 1000);
    // Outside the 1 hour and 1 day windows: only the wider windows can find it
    const previousDate = new Date(newestDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: previousDate },
      { value: 9999, created_at: newestDate },
    ]);

    await deviceInstance.destroyState('test-device-feature', newestDate);

    const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: 'test-device-feature' } });
    expect(deviceFeature.last_value).to.equal(1);
    expect(new Date(deviceFeature.last_value_changed).getTime()).to.equal(previousDate.getTime());
  });

  it('should reset the last value when the whole history is gone', async () => {
    const newestDate = new Date(LAST_VALUE_CHANGED.getTime() + 60 * 1000);
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [{ value: 9999, created_at: newestDate }]);

    await deviceInstance.destroyState('test-device-feature', newestDate);

    const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: 'test-device-feature' } });
    expect(deviceFeature.last_value).to.equal(null);
    expect(deviceFeature.last_value_changed).to.equal(null);
    sinonAssert.calledWith(stateManager.setState, 'deviceFeature', 'test-device-feature', {
      last_value: null,
      last_value_changed: null,
    });
  });

  it('should throw NotFoundError when device feature does not exist', async () => {
    const promise = deviceInstance.destroyState('non-existent-feature', '2018-01-01T10:00:00.000Z');
    await assert.isRejected(promise, 'DeviceFeature not found');
  });

  it('should throw NotFoundError when no state exists at this date', async () => {
    const promise = deviceInstance.destroyState('test-device-feature', '2018-01-01T10:00:00.000Z');
    await assert.isRejected(promise, 'DeviceFeatureState not found');
  });

  it('should throw BadParameters when the date is invalid', async () => {
    const promise = deviceInstance.destroyState('test-device-feature', 'not-a-date');
    await assert.isRejected(promise, 'device.destroyState: Invalid "created_at" date: not-a-date');
  });
});
