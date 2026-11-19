const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');
const { JOB_TYPES, JOB_STATUS } = require('../../../utils/constants');

const FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

const event = new EventEmitter();
const job = new Job(event);

const findTestDevice = () => db.Device.findOne({ where: { selector: 'test-device' } });

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

  it('should run the deletion bound to the device, and own the device meanwhile', async () => {
    const deviceToDestroy = await findTestDevice();
    let deletionWhileRunning;
    device.purgeStatesThenDestroy = fake(async () => {
      deletionWhileRunning = device.devicesBeingDestroyed.get(deviceToDestroy.id);
    });
    await device.destroyAfterStatesPurge(deviceToDestroy, 12000);
    const deletion = {
      id: deviceToDestroy.id,
      selector: 'test-device',
      external_id: deviceToDestroy.external_id,
      name: deviceToDestroy.name,
      statesCount: 12000,
    };
    sinonAssert.calledOnceWithExactly(device.purgeStatesThenDestroy, deletion);
    expect(deletionWhileRunning).to.deep.equal(deletion);
    expect(device.devicesBeingDestroyed.size).to.equal(0);
  });

  it('should never reject, and let the device be deleted again, when the deletion fails', async () => {
    const deviceToDestroy = await findTestDevice();
    device.purgeStatesThenDestroy = fake.rejects(new Error('purge failed'));
    await device.destroyAfterStatesPurge(deviceToDestroy, 12000);
    sinonAssert.calledOnce(device.purgeStatesThenDestroy);
    expect(device.devicesBeingDestroyed.size).to.equal(0);
  });

  it('should delete the device from a refused deletion, without the user coming back', async () => {
    await db.duckDbBatchInsertState(FEATURE_ID, [
      { value: 1, created_at: new Date() },
      { value: 0, created_at: new Date() },
      { value: 1, created_at: new Date() },
    ]);
    const { id } = await findTestDevice();
    const destroyAfterStatesPurge = sinon.spy(device, 'destroyAfterStatesPurge');
    let error;
    try {
      await device.destroy('test-device');
    } catch (e) {
      error = e;
    }
    expect(error).to.have.property('message', '3 states in DB. Too much states!');
    // a second "Delete" during the purge gets the same answer and starts nothing
    let secondError;
    try {
      await device.destroy('test-device');
    } catch (e) {
      secondError = e;
    }
    expect(secondError).to.have.property('message', '3 states in DB. Too much states!');
    sinonAssert.calledOnce(destroyAfterStatesPurge);
    // the deletion goes on in the background
    await destroyAfterStatesPurge.firstCall.returnValue;
    expect(await findTestDevice()).to.equal(null);
    const [{ count }] = await db.duckDbReadConnectionAllAsync(
      'SELECT COUNT(*) AS count FROM t_device_feature_state WHERE device_feature_id = ?',
      FEATURE_ID,
    );
    expect(Number(count)).to.equal(0);
    expect(device.devicesBeingDestroyed.size).to.equal(0);
    expect(device.devicesDestroyedInBackground.has(id)).to.equal(true);
    // one job tells the whole deletion
    const jobs = await db.Job.findAll({ where: { type: JOB_TYPES.DEVICE_DESTROY } });
    expect(jobs).to.have.lengthOf(1);
    expect(jobs[0].status).to.equal(JOB_STATUS.SUCCESS);
    expect(jobs[0].data).to.deep.equal({ device_name: 'Test device', step: 'deleting_device' });
  });
});
