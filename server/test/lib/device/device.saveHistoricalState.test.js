const { expect, assert: chaiAssert } = require('chai');
const { assert, stub } = require('sinon');
const dayjs = require('dayjs');
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
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
      last_value_changed: null,
    });
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
  it('should not be able to save 2 times the same value', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const newDate = new Date().toISOString();
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
      last_value_changed: null,
    });
    const deviceFeature = {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      selector: 'test-device-feature',
      has_feedback: false,
      keep_history: true,
    };
    // Should not save 2 times the same event
    await device.saveHistoricalState(deviceFeature, 12, newDate);
    await device.saveHistoricalState(deviceFeature, 12, newDate);
    const deviceStates = await db.duckDbReadConnectionAllAsync(
      `
      SELECT * FROM t_device_feature_state WHERE device_feature_id = ?  
    `,
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    expect(deviceStates).to.have.lengthOf(1);
  });
  it('should update existing state when value changes at same timestamp', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const newDate = new Date().toISOString();
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
      last_value_changed: null,
    });
    const deviceFeature = {
      id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      selector: 'test-device-feature',
      has_feedback: false,
      keep_history: true,
    };
    // Save initial value
    await device.saveHistoricalState(deviceFeature, 12, newDate);
    // Save different value at same timestamp - should update
    await device.saveHistoricalState(deviceFeature, 15, newDate);
    const deviceStates = await db.duckDbReadConnectionAllAsync(
      `
      SELECT * FROM t_device_feature_state WHERE device_feature_id = ?  
    `,
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    // Should still have only 1 record (updated, not inserted)
    expect(deviceStates).to.have.lengthOf(1);
    // Value should be updated to 15
    expect(deviceStates[0].value).to.equal(15);
  });
  it('should save old state and keep history', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const dateInThePast = new Date(2022, 9, 4, 3).toISOString();
    const dateInTheFuture = new Date(2022, 10, 4, 3);
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
      attributes: ['last_value', 'last_value_changed'],
      raw: true,
    });
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
  });
  it('should save old state and keep history with future last_value_changed', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const dateInThePast = new Date(2022, 9, 4, 3).toISOString();
    const dateInTheFuture = new Date(2022, 10, 4, 3);
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
      attributes: ['last_value', 'last_value_changed'],
      raw: true,
    });
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
  });
  it('should save old state and keep history without updating last_value', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const dateInThePast = new Date(2022, 9, 4, 3).toISOString();
    const dateInTheFuture = new Date(2022, 10, 4, 3);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
      last_value_changed: dateInTheFuture,
    });
    const deviceFeature = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature',
      },
    });
    deviceFeature.set({
      last_value: 5,
      last_value_changed: dateInTheFuture,
    });
    await deviceFeature.save();
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
      attributes: ['last_value', 'last_value_changed'],
      raw: true,
    });
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
  });
  it('should save many states at the same time', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const dateInThePast = new Date(2022, 9, 4, 3).getTime();
    const dateInTheFuture = new Date(2022, 10, 4, 3);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
      last_value_changed: dateInTheFuture,
    });
    const deviceFeature = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature',
      },
    });
    deviceFeature.set({
      last_value: 5,
      last_value_changed: dateInTheFuture,
    });
    await deviceFeature.save();
    const saveOneState = async (value, date) => {
      await device.saveHistoricalState(
        {
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          selector: 'test-device-feature',
          has_feedback: false,
          keep_history: true,
        },
        value,
        new Date(date).toISOString(),
      );
    };

    await Promise.all([
      saveOneState(1, dateInThePast + 25 * 24 * 60 * 60 * 1000),
      saveOneState(2, dateInThePast + 10 * 24 * 60 * 60 * 1000),
      saveOneState(3, dateInThePast + 5 * 24 * 60 * 60 * 1000),
      saveOneState(4, dateInThePast + 4 * 24 * 60 * 60 * 1000),
      saveOneState(4, dateInThePast + 1 * 24 * 60 * 60 * 1000),
      saveOneState(12, dateInThePast),
    ]);

    assert.notCalled(event.emit);
    const newDeviceFeatureInDB = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature',
      },
      attributes: ['last_value', 'last_value_changed'],
      raw: true,
    });
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
  });
  it('should save old state with future last_value_changed', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const dateInThePast = dayjs('2021-10-04T06:00:00.000Z').toISOString();
    const dateInTheFuture = dayjs('2022-10-10T16:00:00.000Z').toDate();
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      name: 'Thermostat',
      last_value: 5,
      last_value_changed: dateInTheFuture,
    });
    const deviceFeature = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature',
      },
    });
    deviceFeature.set({
      last_value: 5,
      last_value_changed: dateInTheFuture,
    });
    await deviceFeature.save();
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
      attributes: ['last_value', 'last_value_changed'],
      raw: true,
    });

    // Verify device in DB - last_value should remain 5 since dateInThePast is older
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);

    // Verify device in RAM
    const deviceInRam = stateManager.get('deviceFeature', 'test-device-feature');
    expect(deviceInRam.last_value).to.deep.equal(5);
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
    return chaiAssert.isRejected(promise, '"value" must be in ISO 8601 date format');
  });
});
