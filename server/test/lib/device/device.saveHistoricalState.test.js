const { expect, assert: chaiAssert } = require('chai');
const { assert, stub } = require('sinon');
const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

describe('Device.saveHistoricalState', () => {
  it('should save new state and keep history', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const newDate = new Date().toISOString();
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    await device.saveHistoricalState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      12,
      newDate,
    );
    assert.calledWith(event.emit.firstCall, 'websocket.send-all', {
      payload: {
        device_feature_selector: 'test-device-feature',
        last_value: 12,
        last_value_changed: new Date(newDate),
      },
      type: 'device.new-state',
    });
  });
  it('should save old state and keep history', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const dateInThePast = new Date('2022-09-04T03:52:36.174Z').toISOString();
    const dateInTheFuture = new Date('2022-10-04T03:52:36.174Z');
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
      last_value_changed: dateInTheFuture,
    });
    await db.DeviceFeature.update(
      {
        last_value: 5,
        last_value_changed: dateInTheFuture,
      },
      {
        where: {
          selector: 'test-device-feature',
        },
      },
    );
    await device.saveHistoricalState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      12,
      dateInThePast,
    );
    assert.notCalled(event.emit);
    const newDeviceFeatureInDB = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature',
      },
      attributes: [
        'last_monthly_aggregate',
        'last_daily_aggregate',
        'last_hourly_aggregate',
        'last_value',
        'last_value_changed',
      ],
      raw: true,
    });
    expect(new Date(newDeviceFeatureInDB.last_monthly_aggregate)).to.deep.equal(
      new Date('2022-08-31 17:00:00.000 +00:00'),
    );
    expect(new Date(newDeviceFeatureInDB.last_daily_aggregate)).to.deep.equal(
      new Date('2022-09-03 17:00:00.000 +00:00'),
    );
    expect(new Date(newDeviceFeatureInDB.last_hourly_aggregate)).to.deep.equal(
      new Date('2022-09-03 17:00:00.000 +00:00'),
    );
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
    expect(new Date(newDeviceFeatureInDB.last_value_changed)).to.deep.equal(new Date('2022-10-04 03:52:36.174 +00:00'));
  });
  it('should return error, invalid number', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const newDate = new Date().toISOString();
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const promise = device.saveHistoricalState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      // @ts-ignore
      'toto',
      newDate,
    );
    return chaiAssert.isRejected(promise, 'Validation error: Validation isFloat on last_value failed');
  });
  it('should return error, invalid number', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const newDate = new Date().toISOString();
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const promise = device.saveHistoricalState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      parseInt('dskflj', 10),
      newDate,
    );
    return chaiAssert.isRejected(promise, 'device.saveHistoricalState of NaN value on test-device-feature');
  });
  it('should return error, invalid date', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const invalideDate = 'error';
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const promise = device.saveHistoricalState(
      {
        id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
        selector: 'test-device-feature',
        has_feedback: false,
        keep_history: true,
      },
      12,
      invalideDate,
    );
    return chaiAssert.isRejected(promise, '"value" must be a valid ISO 8601 date');
  });
});
