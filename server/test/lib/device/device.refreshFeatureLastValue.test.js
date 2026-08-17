const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const job = new Job(new EventEmitter());

const DEVICE_FEATURE = {
  id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
  selector: 'test-device-feature',
};
const NOW = new Date('2019-02-12T07:49:07.556Z');
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

describe('Device.refreshFeatureLastValue', () => {
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

  it('should use the last state given by the caller without querying the history', async () => {
    const lastState = { value: 21.5, created_at: NOW };

    const result = await deviceInstance.refreshFeatureLastValue(DEVICE_FEATURE, { lastState });

    expect(result).to.deep.equal({ last_value: 21.5, last_value_changed: NOW });
    const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: DEVICE_FEATURE.selector } });
    expect(deviceFeature.last_value).to.equal(21.5);
    expect(new Date(deviceFeature.last_value_changed).getTime()).to.equal(NOW.getTime());
    sinonAssert.calledWith(stateManager.setState, 'deviceFeature', DEVICE_FEATURE.selector, {
      last_value: 21.5,
      last_value_changed: NOW,
    });
    sinonAssert.calledWith(eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      payload: {
        device_feature_selector: DEVICE_FEATURE.selector,
        last_value: 21.5,
        last_value_changed: NOW,
      },
    });
  });

  it('should find the previous state in the first time window', async () => {
    const previousDate = new Date(NOW.getTime() - 60 * 1000);
    await db.duckDbBatchInsertState(DEVICE_FEATURE.id, [{ value: 12, created_at: previousDate }]);

    const result = await deviceInstance.refreshFeatureLastValue(DEVICE_FEATURE, { before: NOW });

    expect(result.last_value).to.equal(12);
    expect(result.last_value_changed.getTime()).to.equal(previousDate.getTime());
  });

  it('should widen the time window until the previous state is found', async () => {
    // Outside the 1 hour, 1 day and 7 days windows: only a wider window can find it
    const previousDate = new Date(NOW.getTime() - 20 * ONE_DAY_IN_MS);
    await db.duckDbBatchInsertState(DEVICE_FEATURE.id, [{ value: 13, created_at: previousDate }]);

    const result = await deviceInstance.refreshFeatureLastValue(DEVICE_FEATURE, { before: NOW });

    expect(result.last_value).to.equal(13);
    expect(result.last_value_changed.getTime()).to.equal(previousDate.getTime());
  });

  it('should fall back to the unbounded query for a very old previous state', async () => {
    // Older than every bounded window (the widest one is 365 days)
    const previousDate = new Date(NOW.getTime() - 800 * ONE_DAY_IN_MS);
    await db.duckDbBatchInsertState(DEVICE_FEATURE.id, [{ value: 14, created_at: previousDate }]);

    const result = await deviceInstance.refreshFeatureLastValue(DEVICE_FEATURE, { before: NOW });

    expect(result.last_value).to.equal(14);
    expect(result.last_value_changed.getTime()).to.equal(previousDate.getTime());
  });

  it('should only consider states strictly before the given date', async () => {
    const previousDate = new Date(NOW.getTime() - 60 * 1000);
    await db.duckDbBatchInsertState(DEVICE_FEATURE.id, [
      { value: 15, created_at: previousDate },
      { value: 9999, created_at: NOW },
      { value: 8888, created_at: new Date(NOW.getTime() + 60 * 1000) },
    ]);

    const result = await deviceInstance.refreshFeatureLastValue(DEVICE_FEATURE, { before: NOW });

    expect(result.last_value).to.equal(15);
    expect(result.last_value_changed.getTime()).to.equal(previousDate.getTime());
  });

  it('should reset the last value when there is no previous state', async () => {
    const result = await deviceInstance.refreshFeatureLastValue(DEVICE_FEATURE, { before: NOW });

    expect(result).to.deep.equal({ last_value: null, last_value_changed: null });
    const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: DEVICE_FEATURE.selector } });
    expect(deviceFeature.last_value).to.equal(null);
    expect(deviceFeature.last_value_changed).to.equal(null);
    sinonAssert.calledWith(stateManager.setState, 'deviceFeature', DEVICE_FEATURE.selector, {
      last_value: null,
      last_value_changed: null,
    });
    sinonAssert.calledWith(eventManager.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      payload: {
        device_feature_selector: DEVICE_FEATURE.selector,
        last_value: null,
        last_value_changed: null,
      },
    });
  });
});
