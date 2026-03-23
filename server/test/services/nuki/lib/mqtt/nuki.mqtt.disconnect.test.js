const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const { mqttService } = require('../../mocks/mqtt.mock.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
  device: {
    get: fake.resolves([{ external_id: 'nuki:4242' }, { external_id: 'nuki:4343' }]),
  },
};

describe('Nuki - MQTT - disconnect', () => {
  let nukiHandler;

  beforeEach(() => {
    const nuki = new NukiHandler(gladys, serviceId);

    nukiHandler = new NukiMQTTHandler(nuki);
    nukiHandler.mqttService = mqttService;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should disconnect with unsubscription of all devices topics', () => {
    nukiHandler.disconnect();
    nukiHandler.mqttService.device.unsubscribe.firstCall.calledWith('homeassistant/#');
    // nukiHandler.mqttService.device.unsubscribe.secondCall.calledWith('nuki/4242/#');
    // nukiHandler.mqttService.device.unsubscribe.thirdCall.calledWith('nuki/4343/#');
  });

  it('should clear scan timeout on disconnect', async () => {
    // Simulate an active scan timeout
    const fakeTimeout = setTimeout(() => {}, 10000);
    nukiHandler.scanTimeout = fakeTimeout;

    await nukiHandler.disconnect();

    expect(nukiHandler.scanTimeout).to.equal(null);
  });

  it('should handle disconnect when no scan timeout is active', async () => {
    // Ensure scanTimeout is null
    nukiHandler.scanTimeout = null;

    // Should not throw
    await nukiHandler.disconnect();

    expect(nukiHandler.scanTimeout).to.equal(null);
  });
});
