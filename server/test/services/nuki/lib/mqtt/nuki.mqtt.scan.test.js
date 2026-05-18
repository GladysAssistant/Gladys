const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const { mqttService } = require('../../mocks/mqtt.mock.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
  variable: {
    getValue: fake.resolves(null),
  },
};

describe('nuki.mqtt.scan command', () => {
  let nukiHandler;
  let clock;

  beforeEach(() => {
    sinon.reset();
    clock = sinon.useFakeTimers();
    const nuki = new NukiHandler(gladys, serviceId);
    nukiHandler = new NukiMQTTHandler(nuki);
    nukiHandler.mqttService = mqttService;
    // Use short timeout for tests
    nukiHandler.scanTimeoutMs = 100;
    sinon.spy(nukiHandler, 'handleMessage');
  });

  afterEach(() => {
    clock.restore();
  });

  it('should subscribe to mqtt topic', async () => {
    mqttService.isUsed = fake.resolves(true);
    await nukiHandler.scan();
    assert.callCount(nukiHandler.mqttService.device.unsubscribe, 1);
    nukiHandler.mqttService.device.unsubscribe.firstCall.calledWith('homeassistant/#');
    assert.callCount(nukiHandler.mqttService.device.subscribe, 1);
    nukiHandler.mqttService.device.subscribe.firstCall.calledWith(
      'homeassistant/#',
      nukiHandler.handleMessage.bind(nukiHandler),
    );
  });

  it('should raise an error', async () => {
    mqttService.isUsed = fake.resolves(false);
    await expect(nukiHandler.scan()).to.be.rejectedWith(Error);
    assert.notCalled(nukiHandler.mqttService.device.unsubscribe);
    assert.notCalled(nukiHandler.mqttService.device.subscribe);
  });

  it('should unsubscribe from discovery topic after timeout', async () => {
    mqttService.isUsed = fake.resolves(true);
    await nukiHandler.scan();

    // Verify initial subscription
    assert.callCount(nukiHandler.mqttService.device.subscribe, 1);
    assert.callCount(nukiHandler.mqttService.device.unsubscribe, 1);

    // Fast-forward past the scan timeout
    clock.tick(100);

    // Should have unsubscribed from discovery topic
    assert.callCount(nukiHandler.mqttService.device.unsubscribe, 2);
    expect(nukiHandler.scanTimeout).to.equal(null);
  });

  it('should clear previous timeout when scanning again', async () => {
    mqttService.isUsed = fake.resolves(true);

    // First scan
    await nukiHandler.scan();
    const firstTimeout = nukiHandler.scanTimeout;
    expect(firstTimeout).to.not.equal(null);

    // Second scan before timeout expires
    clock.tick(50);
    await nukiHandler.scan();

    // Should have a new timeout
    expect(nukiHandler.scanTimeout).to.not.equal(null);

    // Fast-forward past the new timeout
    clock.tick(100);

    // Should only have 2 unsubscribes from scan() calls + 1 from timeout
    // (first timeout was cleared, only second one fired)
    assert.callCount(nukiHandler.mqttService.device.unsubscribe, 3);
    expect(nukiHandler.scanTimeout).to.equal(null);
  });
});
