const EventEmitter = require('events');
const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');

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
  it('should not destroy at once a device that has too much states, and hand it over to the background deletion', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    device.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE = 2;
    device.destroyAfterStatesPurge = fake.resolves(null);
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
    // the device is still there, and its deletion goes on in the background
    expect(await db.Device.findOne({ where: { selector: 'test-device' } })).not.to.equal(null);
    sinonAssert.calledOnce(device.destroyAfterStatesPurge);
    const [deviceToDestroy] = device.destroyAfterStatesPurge.firstCall.args;
    expect(deviceToDestroy).to.have.property('selector', 'test-device');
    expect(deviceToDestroy.features.map((feature) => feature.id)).to.include('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4');
  });
  it('should destroy a device that has too much states when the guard is skipped', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    device.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE = 2;
    device.destroyAfterStatesPurge = fake.resolves(null);
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      { value: 1, created_at: new Date() },
      { value: 0, created_at: new Date() },
      { value: 1, created_at: new Date() },
    ]);
    await device.destroy('test-device', { skipStatesGuard: true });
    expect(await db.Device.findOne({ where: { selector: 'test-device' } })).to.equal(null);
    const res = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
    );
    expect(res).to.have.lengthOf(0);
    sinonAssert.notCalled(device.destroyAfterStatesPurge);
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
