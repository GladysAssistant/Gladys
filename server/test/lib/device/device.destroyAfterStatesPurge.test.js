const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');

const FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

const event = new EventEmitter();
const job = new Job(event);

const findTestDevice = () =>
  db.Device.findOne({
    include: [{ model: db.DeviceFeature, as: 'features' }],
    where: { selector: 'test-device' },
  });

const countStates = async () => {
  const [{ count }] = await db.duckDbReadConnectionAllAsync(
    'SELECT COUNT(*) AS count FROM t_device_feature_state WHERE device_feature_id = ?',
    FEATURE_ID,
  );
  return Number(count);
};

describe('Device.destroyAfterStatesPurge', () => {
  let device;
  afterEach(() => {
    sinon.restore();
  });
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    device = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    device.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE = 2;
    device.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH = 0;
  });

  it('should purge the states of every feature, then delete the device', async () => {
    await db.duckDbBatchInsertState(FEATURE_ID, [
      { value: 1, created_at: new Date() },
      { value: 0, created_at: new Date() },
      { value: 1, created_at: new Date() },
    ]);
    const deviceToDestroy = await findTestDevice();
    const purgeStatesByFeatureId = sinon.spy(device, 'purgeStatesByFeatureId');
    await device.destroyAfterStatesPurge(deviceToDestroy);
    expect(purgeStatesByFeatureId.callCount).to.equal(deviceToDestroy.features.length);
    deviceToDestroy.features.forEach((feature) => {
      sinonAssert.calledWith(purgeStatesByFeatureId, feature.id);
    });
    expect(await findTestDevice()).to.equal(null);
    expect(await countStates()).to.equal(0);
    expect(device.devicesBeingDestroyed.has('test-device')).to.equal(false);
  });

  it('should delete the device from a refused deletion, without the user coming back', async () => {
    await db.duckDbBatchInsertState(FEATURE_ID, [
      { value: 1, created_at: new Date() },
      { value: 0, created_at: new Date() },
      { value: 1, created_at: new Date() },
    ]);
    const destroyAfterStatesPurge = sinon.spy(device, 'destroyAfterStatesPurge');
    let error;
    try {
      await device.destroy('test-device');
    } catch (e) {
      error = e;
    }
    expect(error).to.have.property('message', '3 states in DB. Too much states!');
    // the deletion goes on in the background
    await destroyAfterStatesPurge.firstCall.returnValue;
    expect(await findTestDevice()).to.equal(null);
    expect(await countStates()).to.equal(0);
  });

  it('should delete the device with the states it saved during the purge', async () => {
    const deviceToDestroy = await findTestDevice();
    // the device is still alive while its states are purged
    device.purgeStatesByFeatureId = fake(async () => {
      await db.duckDbBatchInsertState(FEATURE_ID, [
        { value: 1, created_at: new Date() },
        { value: 0, created_at: new Date() },
        { value: 1, created_at: new Date() },
      ]);
    });
    await device.destroyAfterStatesPurge(deviceToDestroy);
    expect(await findTestDevice()).to.equal(null);
    expect(await countStates()).to.equal(0);
  });

  it('should not start a second purge for a device already being deleted', async () => {
    const deviceToDestroy = await findTestDevice();
    device.purgeStatesByFeatureId = fake.resolves(null);
    device.destroy = fake.resolves(null);
    device.devicesBeingDestroyed.add('test-device');
    await device.destroyAfterStatesPurge(deviceToDestroy);
    sinonAssert.notCalled(device.purgeStatesByFeatureId);
    sinonAssert.notCalled(device.destroy);
    // the deletion in flight is still the owner of the flag
    expect(device.devicesBeingDestroyed.has('test-device')).to.equal(true);
  });

  it('should keep the device and never reject when the purge fails', async () => {
    const deviceToDestroy = await findTestDevice();
    device.purgeStatesByFeatureId = fake.rejects(new Error('purge failed'));
    device.destroy = fake.resolves(null);
    await device.destroyAfterStatesPurge(deviceToDestroy);
    sinonAssert.calledOnce(device.purgeStatesByFeatureId);
    sinonAssert.notCalled(device.destroy);
    expect(await findTestDevice()).not.to.equal(null);
    // a new "Delete" can start the purge again
    expect(device.devicesBeingDestroyed.has('test-device')).to.equal(false);
  });
});
