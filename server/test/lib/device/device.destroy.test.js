const EventEmitter = require('events');
const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');
const { isTooMuchStatesError } = require('../../../lib/device/device.destroy');
const { BadParameters } = require('../../../utils/coreErrors');

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
    const [deviceToDestroy, statesCount] = device.destroyAfterStatesPurge.firstCall.args;
    expect(deviceToDestroy).to.have.property('selector', 'test-device');
    expect(statesCount).to.equal(5);
  });
  it('should give the same answer, without counting again, while the device is deleted in the background', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    device.destroyAfterStatesPurge = fake.resolves(null);
    const testDevice = await db.Device.findOne({ where: { selector: 'test-device' } });
    // the purge already brought the device under the limit: a second "Delete" must not
    // delete it under the purge
    device.devicesBeingDestroyed.set(testDevice.id, { statesCount: 12000 });
    const promise = device.destroy('test-device');
    await assert.isRejected(promise, '12000 states in DB. Too much states!');
    expect(await db.Device.findOne({ where: { selector: 'test-device' } })).not.to.equal(null);
    sinonAssert.notCalled(device.destroyAfterStatesPurge);
  });
  it('should destroy the device for its background deletion', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    const testDevice = await db.Device.findOne({ where: { selector: 'test-device' } });
    device.devicesBeingDestroyed.set(testDevice.id, { statesCount: 12000 });
    await db.duckDbInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', 1);
    await device.destroy('test-device', {
      scheduledDeletion: { id: testDevice.id, external_id: testDevice.external_id },
    });
    expect(await db.Device.findOne({ where: { selector: 'test-device' } })).to.equal(null);
  });
  it('should not destroy, for a background deletion, another device than the one to delete', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    const testDevice = await db.Device.findOne({ where: { selector: 'test-device' } });
    // another device took the selector
    await assert.isRejected(
      device.destroy('test-device', {
        scheduledDeletion: { id: 'a2b9ba3a-72b1-4a3e-89e5-4a4e5f0b0d3e', external_id: testDevice.external_id },
      }),
      'Device not found',
    );
    // the device was taken over by another appliance
    await assert.isRejected(
      device.destroy('test-device', {
        scheduledDeletion: { id: testDevice.id, external_id: 'another-external-id' },
      }),
      'Device not found',
    );
    expect(await db.Device.findOne({ where: { selector: 'test-device' } })).not.to.equal(null);
  });
  it('should not start a second background deletion when the device saved too many states during its purge', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    device.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE = 2;
    device.destroyAfterStatesPurge = fake.resolves(null);
    const testDevice = await db.Device.findOne({ where: { selector: 'test-device' } });
    await db.duckDbBatchInsertState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', [
      { value: 1, created_at: new Date() },
      { value: 0, created_at: new Date() },
      { value: 1, created_at: new Date() },
    ]);
    const promise = device.destroy('test-device', {
      scheduledDeletion: { id: testDevice.id, external_id: testDevice.external_id },
    });
    await assert.isRejected(promise, '3 states in DB. Too much states!');
    sinonAssert.notCalled(device.destroyAfterStatesPurge);
    expect(await db.Device.findOne({ where: { selector: 'test-device' } })).not.to.equal(null);
  });
  it('should tell the "too much states" answer apart from any other error', async () => {
    expect(isTooMuchStatesError(new BadParameters('12000 states in DB. Too much states!'))).to.equal(true);
    expect(isTooMuchStatesError(new BadParameters('Another bad parameter'))).to.equal(false);
    expect(isTooMuchStatesError(new Error('12000 states in DB. Too much states!'))).to.equal(false);
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
