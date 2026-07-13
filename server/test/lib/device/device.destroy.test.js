const EventEmitter = require('events');
const { assert, expect } = require('chai');
const { fake, assert: sinonAssert } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');
const { EVENTS } = require('../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.destroy', () => {
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  it('should destroy device and states', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    await db.duckDbInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', 1);
    device.devicesByPollFrequency[60000] = [
      {
        selector: 'test-device',
      },
    ];
    await device.destroy('test-device');
    const res = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    expect(res).to.have.lengthOf(0);
  });
  it('should destroy device that has too much states', async () => {
    const eventFake = {
      emit: fake.returns(0),
      on: fake.returns(0),
    };
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(eventFake, {}, stateManager, serviceManager, {}, {}, job);
    device.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE = 2;
    device.devicesByPollFrequency[60000] = [
      {
        selector: 'test-device',
      },
    ];
    // SQLite leftovers (installation which has not run the DuckDB migration yet)
    await db.DeviceFeatureState.create({
      value: 10,
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    });
    await db.DeviceFeatureState.create({
      value: 10,
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    });
    await db.DeviceFeatureStateAggregate.create({
      value: 10,
      type: 'daily',
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    });
    // States living in DuckDB (the normal case since the migration) must be
    // counted by the guard too
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      { value: 1, created_at: new Date() },
      { value: 0, created_at: new Date() },
    ]);
    const promise = device.destroy('test-device');
    await assert.isRejected(promise, '5 states in DB. Too much states!');
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'ce9dc798-b09f-4e51-8c16-311cdebf97cd',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'bb1af3b9-f87d-4d9c-b5be-958cd9d28900',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      'f07c5b27-9301-4482-a059-9f91329d30e7',
    );
    sinonAssert.calledWith(
      eventFake.emit,
      EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE,
      '3b5b4870-145d-4584-bf0e-d97fdcf908b5',
    );
  });
  it('should destroy a device without features', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    await db.Device.create({
      id: 'a2b9ba3a-72b1-4a3e-89e5-4a4e5f0b0d3e',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      name: 'Device without features',
      selector: 'device-without-features',
      external_id: 'device-without-features',
    });
    await device.destroy('device-without-features');
    const deletedDevice = await db.Device.findOne({
      where: {
        selector: 'device-without-features',
      },
    });
    expect(deletedDevice).to.equal(null);
  });
  it('should return device not found', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    const promise = device.destroy('doesnotexist');
    return assert.isRejected(promise);
  });
});
