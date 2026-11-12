const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const Zigbee2MqttService = require('../../../services/zigbee2mqtt');
const logger = require('../../../utils/logger');

const gladys = {
  event: {
    emit: fake.returns,
  },
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};

describe('zigbee2mqtt service', () => {
  // PREPARE
  let zigbee2MqttService;

  beforeEach(() => {
    zigbee2MqttService = Zigbee2MqttService(gladys, 'f87b7af2-ca8e-44fc-b754-444354b42fee');
    zigbee2MqttService.device.init = fake.resolves(null);
    zigbee2MqttService.device.disconnect = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    // EXECUTE
    await zigbee2MqttService.start();
    // ASSERT
    assert.calledOnce(zigbee2MqttService.device.init);
    assert.notCalled(zigbee2MqttService.device.disconnect);
  });
  it('should stop service', async () => {
    // EXECUTE
    await zigbee2MqttService.stop();
    // ASSERT
    assert.calledOnce(zigbee2MqttService.device.disconnect);
    assert.notCalled(zigbee2MqttService.device.init);
  });

  describe('while an installation runs', () => {
    // Until the promises settled so far have run their callbacks
    const flushPromises = () =>
      new Promise((resolve) => {
        setImmediate(resolve);
      });

    beforeEach(() => {
      zigbee2MqttService.device.emitInstallProgress = fake();
      // Not logged by the end of the installation
      sinon.stub(logger, 'info');
      sinon.stub(logger, 'warn');
      zigbee2MqttService.device.startInstallation('install');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should not start service, as the installation starts Zigbee2mqtt', async () => {
      // EXECUTE
      await zigbee2MqttService.start();
      // ASSERT
      assert.notCalled(zigbee2MqttService.device.init);
    });

    it('should stop service once the installation ended', async () => {
      // EXECUTE
      const stopping = zigbee2MqttService.stop();
      await flushPromises();
      // ASSERT
      assert.notCalled(zigbee2MqttService.device.disconnect);
      zigbee2MqttService.device.finishInstallation(new Error('docker fail pull'));
      await stopping;
      assert.calledOnce(zigbee2MqttService.device.disconnect);
    });

    it('should stop service once when asked again while it waits', async () => {
      // EXECUTE
      const stopping = zigbee2MqttService.stop();
      await flushPromises();
      // The settings still show the service running
      const stoppingAgain = zigbee2MqttService.stop();
      zigbee2MqttService.device.finishInstallation(null);
      await Promise.all([stopping, stoppingAgain]);
      // ASSERT
      assert.calledOnce(zigbee2MqttService.device.disconnect);
      // A later stop stops it again
      await zigbee2MqttService.stop();
      assert.calledTwice(zigbee2MqttService.device.disconnect);
    });

    it('should wait for an installation started meanwhile too', async () => {
      // EXECUTE
      const stopping = zigbee2MqttService.stop();
      await flushPromises();
      // A setup sent as the first one ends
      zigbee2MqttService.device.finishInstallation(null);
      zigbee2MqttService.device.startInstallation('switch');
      await flushPromises();
      // ASSERT
      assert.notCalled(zigbee2MqttService.device.disconnect);
      zigbee2MqttService.device.finishInstallation(null);
      await stopping;
      assert.calledOnce(zigbee2MqttService.device.disconnect);
    });
  });
  it('isUsed: should return false, service not used', async () => {
    const used = await zigbee2MqttService.isUsed();
    expect(used).to.equal(false);
  });
  it('isUsed: should return true, service is used', async () => {
    zigbee2MqttService.device.gladysConnected = true;
    // Zigbee2mqtt answers the health check, so that zigbee2mqtt connected is true
    await zigbee2MqttService.device.handleMqttMessage(
      'zigbee2mqtt/bridge/response/health_check',
      JSON.stringify({ data: { healthy: true }, status: 'ok' }),
    );
    const used = await zigbee2MqttService.isUsed();
    expect(used).to.equal(true);
  });
});
