const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');
const logger = require('../../../../utils/logger');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt runInstallation', () => {
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        // The job wrapper gives the id of the job as last argument
        wrapper: fake((type, func) => async (...args) => func(...args, 'job-id')),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.init = fake.resolves(null);
    zigbee2mqttManager.waitForZigbee2mqtt = fake.resolves(null);
    zigbee2mqttManager.finishInstallation = fake();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should run in a job of the tasks of the settings', () => {
    assert.calledWith(gladys.job.wrapper, 'service-zigbee2mqtt-install');
  });

  it('should install Zigbee2mqtt with the stored setup, then wait for it to answer', async () => {
    // EXECUTE
    await zigbee2mqttManager.runInstallation();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.init, true);
    assert.calledOnceWithExactly(zigbee2mqttManager.waitForZigbee2mqtt);
    sinon.assert.callOrder(zigbee2mqttManager.init, zigbee2mqttManager.waitForZigbee2mqtt);
    assert.calledOnceWithExactly(zigbee2mqttManager.finishInstallation, null);
    // Its job follows the progress of the installation
    expect(zigbee2mqttManager.installationJobId).to.equal('job-id');
  });

  it('should tell the failure of the installation, and fail its job', async () => {
    // PREPARE
    const errorStub = sinon.stub(logger, 'error');
    const error = new Error('docker fail pull');
    zigbee2mqttManager.init = fake.rejects(error);
    // EXECUTE
    const promise = zigbee2mqttManager.runInstallation();
    // ASSERT
    await expect(promise).to.be.rejectedWith(error);
    assert.notCalled(zigbee2mqttManager.waitForZigbee2mqtt);
    assert.calledOnceWithExactly(zigbee2mqttManager.finishInstallation, error);
    assert.calledOnceWithExactly(errorStub, 'Zigbee2mqtt: installation failed:', error);
  });

  it('should tell that Zigbee2mqtt failed to start', async () => {
    // PREPARE
    sinon.stub(logger, 'error');
    const error = new Error('Zigbee2mqtt failed to start: NO_ANSWER');
    zigbee2mqttManager.waitForZigbee2mqtt = fake.rejects(error);
    // EXECUTE
    const promise = zigbee2mqttManager.runInstallation();
    // ASSERT
    await expect(promise).to.be.rejectedWith(error);
    assert.calledOnceWithExactly(zigbee2mqttManager.finishInstallation, error);
  });
});
