const sinon = require('sinon');
const { fake, assert } = require('sinon');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt saveZ2mBackup', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
        updateProgress: fake.resolves(true),
      },
      variable: {
        setValue: fake.resolves('setValue'),
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('it should not store backup', async () => {
    // PREPARE
    const payload = {
      status: 'ko',
    };
    // EXECUTE
    await zigbee2MqttManager.saveZ2mBackup(payload);
    // ASSERT
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.job.updateProgress);
  });

  it('it should store backup', async () => {
    // PREPARE
    const payload = {
      status: 'ok',
      data: {
        zip: 'content',
      },
    };
    // EXECUTE
    await zigbee2MqttManager.saveZ2mBackup(payload);
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.setValue, 'Z2M_BACKUP', payload.data.zip, serviceId);
    assert.notCalled(gladys.job.updateProgress);
  });

  it('it should not store backup, and update core job', async () => {
    // PREPARE
    const payload = {
      status: 'ko',
    };

    const backupJob = {
      jobId: '3e944be0-1aa7-4805-996e-2515e82fc7af',
      resolve: fake.resolves(true),
      reject: fake.resolves(true),
    };
    zigbee2MqttManager.backupJob = backupJob;

    // EXECUTE
    await zigbee2MqttManager.saveZ2mBackup(payload);
    // ASSERT
    assert.notCalled(gladys.variable.setValue);
    assert.calledOnceWithExactly(gladys.job.updateProgress, backupJob.jobId, 60);
    assert.calledOnceWithExactly(backupJob.reject);
    assert.notCalled(backupJob.resolve);
  });

  it('it should store backup, and update core job', async () => {
    // PREPARE
    const payload = {
      status: 'ok',
      data: {
        zip: 'content',
      },
    };

    const backupJob = {
      jobId: '3e944be0-1aa7-4805-996e-2515e82fc7af',
      resolve: fake.resolves(true),
      reject: fake.resolves(true),
    };
    zigbee2MqttManager.backupJob = backupJob;

    // EXECUTE
    await zigbee2MqttManager.saveZ2mBackup(payload);
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.setValue, 'Z2M_BACKUP', payload.data.zip, serviceId);
    assert.callCount(gladys.job.updateProgress, 2);
    assert.calledWithExactly(gladys.job.updateProgress, backupJob.jobId, 60);
    assert.calledWithExactly(gladys.job.updateProgress, backupJob.jobId, 100);
    assert.calledOnceWithExactly(backupJob.resolve);
    assert.notCalled(backupJob.reject);
  });
});
