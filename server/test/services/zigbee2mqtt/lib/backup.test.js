const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {};
const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const jobId = '4129fecb-3238-4df2-b296-ffa7851b81fa';

describe('zigbee2mqtt backup', () => {
  // PREPARE
  let zigbee2MqttManager;
  let clock;

  beforeEach(() => {
    gladys.job = {
      wrapper: (type, func) => {
        return async (args) => {
          return func(args);
        };
      },
      updateProgress: fake.resolves(true),
    };

    zigbee2MqttManager = new Zigbee2MqttService(gladys, mqttLibrary, serviceId);
    zigbee2MqttManager.mqttClient = {
      publish: fake.resolves(true),
    };

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('rejects as service not configured', async () => {
    // PREPARE
    zigbee2MqttManager.mqttRunning = false;
    // EXECUTE
    try {
      await zigbee2MqttManager.backup(jobId);
      expect.fail();
    } catch (e) {
      expect(e)
        .instanceOf(ServiceNotConfiguredError)
        .property('message', 'SERVICE_NOT_CONFIGURED');
    }
    // ASSERT
    assert.notCalled(gladys.job.updateProgress);
    assert.notCalled(zigbee2MqttManager.mqttClient.publish);
    expect(zigbee2MqttManager.backupJob).deep.equals({});
  });

  it('send backup request', async () => {
    // PREPARE
    zigbee2MqttManager.mqttClient.publish = (topic) => {
      expect(topic).to.equals('zigbee2mqtt/bridge/request/backup');
      // Force end of task
      return zigbee2MqttManager.backupJob.resolve('success');
    };
    zigbee2MqttManager.mqttRunning = true;
    zigbee2MqttManager.zigbee2mqttRunning = true;
    zigbee2MqttManager.usbConfigured = true;
    // EXECUTE
    const resultPromise = zigbee2MqttManager.backup(jobId);
    // ASSERT
    assert.calledOnceWithExactly(gladys.job.updateProgress, jobId, 30);
    // Exec promise
    const result = await resultPromise;
    // Check timer is out
    clock.tick(60000);
    expect(result).to.equals('success');
    expect(zigbee2MqttManager.backupJob).deep.equals({});
  });

  it('send backup request is timeout', async () => {
    // PREPARE
    zigbee2MqttManager.mqttRunning = true;
    zigbee2MqttManager.zigbee2mqttRunning = true;
    zigbee2MqttManager.usbConfigured = true;

    // EXECUTE
    const resultPromise = zigbee2MqttManager.backup(jobId);
    // Check timer is out
    clock.tick(60000);
    try {
      await resultPromise;
      assert.fail();
    } catch (e) {
      expect(e).to.equals("Backup request time's out");
    }

    assert.calledOnceWithExactly(gladys.job.updateProgress, jobId, 30);
    assert.calledOnceWithExactly(zigbee2MqttManager.mqttClient.publish, 'zigbee2mqtt/bridge/request/backup');
    expect(zigbee2MqttManager.backupJob).deep.equals({});
  });
});
