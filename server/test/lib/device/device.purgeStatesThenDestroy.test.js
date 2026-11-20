const EventEmitter = require('events');
const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');
const { JOB_TYPES, JOB_STATUS } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');

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

const insertThreeStates = () =>
  db.duckDbBatchInsertState(FEATURE_ID, [
    { value: 1, created_at: new Date() },
    { value: 0, created_at: new Date() },
    { value: 1, created_at: new Date() },
  ]);

const getDeletionJob = async () => {
  const jobs = await db.Job.findAll({ where: { type: JOB_TYPES.DEVICE_DESTROY } });
  expect(jobs).to.have.lengthOf(1);
  return jobs[0];
};

describe('Device.purgeStatesThenDestroy', () => {
  let device;
  let testDevice;
  let deletion;
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
    testDevice = await findTestDevice();
    deletion = {
      id: testDevice.id,
      selector: testDevice.selector,
      external_id: testDevice.external_id,
      name: testDevice.name,
      statesCount: 3,
    };
  });

  it('should purge the states of every feature, then delete the device, in one job', async () => {
    await insertThreeStates();
    const purgeStatesByFeatureId = sinon.spy(device, 'purgeStatesByFeatureId');
    await device.purgeStatesThenDestroy(deletion);
    expect(purgeStatesByFeatureId.callCount).to.equal(testDevice.features.length);
    testDevice.features.forEach((feature) => {
      sinonAssert.calledWith(purgeStatesByFeatureId, feature.id);
    });
    expect(await findTestDevice()).to.equal(null);
    expect(await countStates()).to.equal(0);
    expect(device.devicesDestroyedInBackground.has(testDevice.id)).to.equal(true);
    const deletionJob = await getDeletionJob();
    expect(deletionJob.status).to.equal(JOB_STATUS.SUCCESS);
    expect(deletionJob.progress).to.equal(100);
    expect(deletionJob.data).to.deep.equal({ device_name: testDevice.name, step: 'deleting_device' });
  });

  it('should do nothing when the device is already gone', async () => {
    device.purgeStatesByFeatureId = fake.resolves(null);
    device.destroy = fake.resolves(null);
    await device.purgeStatesThenDestroy({ ...deletion, id: 'a2b9ba3a-72b1-4a3e-89e5-4a4e5f0b0d3e' });
    sinonAssert.notCalled(device.purgeStatesByFeatureId);
    sinonAssert.notCalled(device.destroy);
    const deletionJob = await getDeletionJob();
    expect(deletionJob.status).to.equal(JOB_STATUS.SUCCESS);
    expect(deletionJob.data).not.to.have.property('device_kept');
  });

  it('should purge and delete nothing when the device was taken over by another appliance', async () => {
    await insertThreeStates();
    device.purgeStatesByFeatureId = fake.resolves(null);
    device.destroy = fake.resolves(null);
    // "Replace existing": same row, same id, another external_id
    await db.Device.update({ external_id: 'another-appliance' }, { where: { id: testDevice.id } });
    await device.purgeStatesThenDestroy(deletion);
    sinonAssert.notCalled(device.purgeStatesByFeatureId);
    sinonAssert.notCalled(device.destroy);
    expect(await countStates()).to.equal(3);
    const deletionJob = await getDeletionJob();
    expect(deletionJob.status).to.equal(JOB_STATUS.SUCCESS);
    expect(deletionJob.data).to.deep.equal({
      device_name: testDevice.name,
      step: 'purging_states',
      device_kept: true,
    });
  });

  it('should stop purging when the device is taken over during the purge', async () => {
    device.destroy = fake.resolves(null);
    device.purgeStatesByFeatureId = fake(async () => {
      await db.Device.update({ external_id: 'another-appliance' }, { where: { id: testDevice.id } });
    });
    await device.purgeStatesThenDestroy(deletion);
    // the first feature was being purged when the device was taken over: none after it
    sinonAssert.calledOnce(device.purgeStatesByFeatureId);
    sinonAssert.notCalled(device.destroy);
    expect(await findTestDevice()).not.to.equal(null);
    expect((await getDeletionJob()).data).to.have.property('device_kept', true);
  });

  it('should not delete the device when it is taken over during the last purge', async () => {
    device.destroy = fake.resolves(null);
    let numberOfPurges = 0;
    device.purgeStatesByFeatureId = fake(async () => {
      numberOfPurges += 1;
      if (numberOfPurges === testDevice.features.length) {
        await db.Device.update({ external_id: 'another-appliance' }, { where: { id: testDevice.id } });
      }
    });
    await device.purgeStatesThenDestroy(deletion);
    expect(device.purgeStatesByFeatureId.callCount).to.equal(testDevice.features.length);
    sinonAssert.notCalled(device.destroy);
    expect(await findTestDevice()).not.to.equal(null);
    expect(device.devicesDestroyedInBackground.size).to.equal(0);
  });

  it('should purge the other features and keep the device when a purge fails', async () => {
    device.destroy = fake.resolves(null);
    let numberOfPurges = 0;
    device.purgeStatesByFeatureId = fake(async () => {
      numberOfPurges += 1;
      if (numberOfPurges === 1) {
        throw new Error('purge failed');
      }
    });
    const promise = device.purgeStatesThenDestroy(deletion);
    await assert.isRejected(promise, 'The states of 1 feature(s) could not be purged, the device is kept');
    expect(device.purgeStatesByFeatureId.callCount).to.equal(testDevice.features.length);
    sinonAssert.notCalled(device.destroy);
    expect((await getDeletionJob()).status).to.equal(JOB_STATUS.FAILED);
  });

  it('should purge again the states the device saved during the purge, then delete it', async () => {
    let numberOfPurges = 0;
    const realPurgeStatesByFeatureId = device.purgeStatesByFeatureId;
    device.purgeStatesByFeatureId = fake(async (featureId) => {
      numberOfPurges += 1;
      await realPurgeStatesByFeatureId(featureId);
      // the device is alive: right after the last purge of the first round, it saved more
      // states than a deletion accepts
      if (numberOfPurges === testDevice.features.length) {
        await insertThreeStates();
      }
    });
    const destroy = sinon.spy(device, 'destroy');
    await device.purgeStatesThenDestroy(deletion);
    expect(device.purgeStatesByFeatureId.callCount).to.equal(testDevice.features.length * 2);
    sinonAssert.calledTwice(destroy);
    expect(await findTestDevice()).to.equal(null);
    expect(await countStates()).to.equal(0);
    expect((await getDeletionJob()).status).to.equal(JOB_STATUS.SUCCESS);
  });

  it('should give up when the device keeps saving too many states', async () => {
    device.MAX_STATES_PURGES_TO_DELETE_DEVICE = 2;
    device.purgeStatesByFeatureId = fake.resolves(null);
    device.destroy = fake.rejects(new BadParameters('3 states in DB. Too much states!'));
    const promise = device.purgeStatesThenDestroy(deletion);
    await assert.isRejected(promise, '3 states in DB. Too much states!');
    sinonAssert.calledTwice(device.destroy);
    sinonAssert.alwaysCalledWithExactly(device.destroy, 'test-device', { scheduledDeletion: deletion });
    expect(device.devicesDestroyedInBackground.size).to.equal(0);
    expect((await getDeletionJob()).status).to.equal(JOB_STATUS.FAILED);
  });

  it('should not try again when the deletion fails for another reason', async () => {
    device.purgeStatesByFeatureId = fake.resolves(null);
    device.destroy = fake.rejects(new Error('database is locked'));
    const promise = device.purgeStatesThenDestroy(deletion);
    await assert.isRejected(promise, 'database is locked');
    sinonAssert.calledOnce(device.destroy);
    expect(device.devicesDestroyedInBackground.size).to.equal(0);
  });
});
