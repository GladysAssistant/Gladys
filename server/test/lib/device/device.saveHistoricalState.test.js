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
      last_monthly_aggregate: null,
      last_daily_aggregate: null,
      last_hourly_aggregate: null,
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
  it('should save old state and keep history, and update aggregate', async () => {
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
      last_monthly_aggregate: dateInTheFuture,
      last_daily_aggregate: dateInTheFuture,
      last_hourly_aggregate: dateInTheFuture,
    });
    await db.DeviceFeature.update(
      {
        last_value: 5,
        last_value_changed: dateInTheFuture,
        last_monthly_aggregate: dateInTheFuture,
        last_daily_aggregate: dateInTheFuture,
        last_hourly_aggregate: dateInTheFuture,
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
    const compareDate = (name, date1, date2) => {
      expect(new Date(date1)).to.be.lessThan(new Date(date2), name);
    };
    compareDate('monthly_aggregate', newDeviceFeatureInDB.last_monthly_aggregate, dateInTheFuture);
    compareDate('daily_aggregate', newDeviceFeatureInDB.last_daily_aggregate, dateInTheFuture);
    compareDate('hourly_aggregate', newDeviceFeatureInDB.last_hourly_aggregate, dateInTheFuture);
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
  });
  it('should save old state and keep history, and not update null aggregate', async () => {
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
      last_monthly_aggregate: null,
      last_daily_aggregate: null,
      last_hourly_aggregate: null,
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
    expect(newDeviceFeatureInDB.last_monthly_aggregate).to.equal(null);
    expect(newDeviceFeatureInDB.last_daily_aggregate).to.equal(null);
    expect(newDeviceFeatureInDB.last_hourly_aggregate).to.equal(null);
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
  });
  it('should save old state and keep history, and not update less recent aggregate', async () => {
    const event = {
      emit: stub().returns(null),
      on: stub().returns(null),
    };
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const dateInThePast = new Date(2022, 9, 4, 3).toISOString();
    const dateEvenBeforeInThePast = new Date(2021, 9, 4, 3).toISOString();
    const dateInTheFuture = new Date(2022, 10, 4, 3);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    stateManager.setState('deviceFeature', 'test-device-feature', {
      last_value: 5,
      last_value_changed: dateInTheFuture,
      last_monthly_aggregate: dateEvenBeforeInThePast,
      last_daily_aggregate: dateEvenBeforeInThePast,
      last_hourly_aggregate: dateEvenBeforeInThePast,
    });
    const deviceFeature = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature',
      },
    });
    deviceFeature.set({
      last_value: 5,
      last_value_changed: dateInTheFuture,
      last_monthly_aggregate: dateEvenBeforeInThePast,
      last_daily_aggregate: dateEvenBeforeInThePast,
      last_hourly_aggregate: dateEvenBeforeInThePast,
    });
    await deviceFeature.save();
    const oldDeviceInDb = await db.DeviceFeature.findOne({
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
    expect(newDeviceFeatureInDB.last_monthly_aggregate).to.deep.equal(oldDeviceInDb.last_monthly_aggregate);
    expect(newDeviceFeatureInDB.last_daily_aggregate).to.deep.equal(oldDeviceInDb.last_daily_aggregate);
    expect(newDeviceFeatureInDB.last_hourly_aggregate).to.deep.equal(oldDeviceInDb.last_hourly_aggregate);
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);
  });
  it('should save old state and update recent aggregate', async () => {
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
      last_monthly_aggregate: dateInTheFuture,
      last_daily_aggregate: dateInTheFuture,
      last_hourly_aggregate: dateInTheFuture,
    });
    const deviceFeature = await db.DeviceFeature.findOne({
      where: {
        selector: 'test-device-feature',
      },
    });
    deviceFeature.set({
      last_value: 5,
      last_value_changed: dateInTheFuture,
      last_monthly_aggregate: dateInTheFuture,
      last_daily_aggregate: dateInTheFuture,
      last_hourly_aggregate: dateInTheFuture,
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
      attributes: [
        'last_monthly_aggregate',
        'last_daily_aggregate',
        'last_hourly_aggregate',
        'last_value',
        'last_value_changed',
      ],
      raw: true,
    });

    const dailyFormat = (date) => dayjs(date, 'Europe/Paris').format('YYYY-MM-DD');
    const hourlyFormat = (date) => dayjs(date, 'Europe/Paris').format('YYYY-MM-DD HH:mm');

    // Verify device in DB
    expect(dailyFormat(newDeviceFeatureInDB.last_monthly_aggregate)).to.deep.equal('2021-08-31');
    expect(hourlyFormat(newDeviceFeatureInDB.last_daily_aggregate)).to.deep.equal('2021-10-03 23:59');
    expect(hourlyFormat(newDeviceFeatureInDB.last_hourly_aggregate)).to.deep.equal('2021-10-03 23:59');
    expect(newDeviceFeatureInDB.last_value).to.deep.equal(5);

    // Verify device in RAM
    const deviceInRam = stateManager.get('deviceFeature', 'test-device-feature');
    expect(dailyFormat(deviceInRam.last_monthly_aggregate)).to.deep.equal('2021-08-31');
    expect(hourlyFormat(deviceInRam.last_daily_aggregate)).to.deep.equal('2021-10-03 23:59');
    expect(hourlyFormat(deviceInRam.last_hourly_aggregate)).to.deep.equal('2021-10-03 23:59');
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
