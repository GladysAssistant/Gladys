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

describe('Device.updateState', () => {
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

  it('should update the value of an old state without touching the last value', async () => {
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: new Date('2018-01-01T10:00:00.000Z') },
      { value: 2, created_at: new Date('2018-01-01T11:00:00.000Z') },
    ]);

    const state = await deviceInstance.updateState('test-device-feature', '2018-01-01T10:00:00.000Z', 42);

    expect(state).to.deep.equal({
      created_at: new Date('2018-01-01T10:00:00.000Z'),
      value: 42,
    });
    const states = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ? ORDER BY created_at',
      DEVICE_FEATURE_ID,
    );
    expect(states).to.have.lengthOf(2);
    expect(states[0].value).to.equal(42);
    expect(states[1].value).to.equal(2);
    // The corrected state is not the current value of the feature: nothing to refresh
    sinonAssert.notCalled(stateManager.setState);
    sinonAssert.notCalled(eventManager.emit);
  });

  it('should update the value of the most recent state and refresh the last value', async () => {
    const newestDate = new Date(LAST_VALUE_CHANGED.getTime() + 60 * 1000);
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: new Date(LAST_VALUE_CHANGED.getTime() - 60 * 1000) },
      { value: 2, created_at: newestDate },
    ]);

    await deviceInstance.updateState('test-device-feature', newestDate, 42);

    const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: 'test-device-feature' } });
    expect(deviceFeature.last_value).to.equal(42);
    expect(new Date(deviceFeature.last_value_changed).getTime()).to.equal(newestDate.getTime());
    sinonAssert.calledWith(stateManager.setState, 'deviceFeature', 'test-device-feature', {
      last_value: 42,
      last_value_changed: newestDate,
    });
    sinonAssert.calledWith(eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      payload: {
        device_feature_selector: 'test-device-feature',
        last_value: 42,
        last_value_changed: newestDate,
      },
    });
  });

  it('should refresh the last value when the device feature has no last value yet', async () => {
    await db.DeviceFeature.update({ last_value_changed: null }, { where: { selector: 'test-device-feature' } });
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, [
      { value: 1, created_at: new Date('2018-01-01T10:00:00.000Z') },
    ]);

    await deviceInstance.updateState('test-device-feature', '2018-01-01T10:00:00.000Z', 12);

    const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: 'test-device-feature' } });
    expect(deviceFeature.last_value).to.equal(12);
  });

  it('should throw NotFoundError when device feature does not exist', async () => {
    const promise = deviceInstance.updateState('non-existent-feature', '2018-01-01T10:00:00.000Z', 12);
    await assert.isRejected(promise, 'DeviceFeature not found');
  });

  it('should throw NotFoundError when no state exists at this date', async () => {
    const promise = deviceInstance.updateState('test-device-feature', '2018-01-01T10:00:00.000Z', 12);
    await assert.isRejected(promise, 'DeviceFeatureState not found');
  });

  it('should throw BadParameters when the date is invalid', async () => {
    const promise = deviceInstance.updateState('test-device-feature', 'not-a-date', 12);
    await assert.isRejected(promise, 'device.updateState: Invalid "created_at" date: not-a-date');
  });

  it('should throw BadParameters when the value is not a number', async () => {
    const promise = deviceInstance.updateState('test-device-feature', '2018-01-01T10:00:00.000Z', 'not-a-number');
    await assert.isRejected(promise, 'device.updateState: "value" should be a number');
  });
});
