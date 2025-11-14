const sinon = require('sinon');

const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

const mqttService = {
  device: {
    unsubscribe: fake.returns(true),
    subscribe: fake.returns(true),
  },
};

const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
};

describe('nuki.mqtt.scan command', () => {
  let nukiHandler;

  beforeEach(() => {
    const nuki = new NukiHandler(gladys, serviceId);
    nukiHandler = new NukiMQTTHandler(nuki);
    nukiHandler.mqttService = mqttService;
    sinon.spy(nukiHandler, 'handleMessage');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should subscribe to mqtt topic', async () => {
    nukiHandler.scan();
    assert.callCount(nukiHandler.mqttService.device.unsubscribe, 1);
    nukiHandler.mqttService.device.unsubscribe.firstCall.calledWith('homeassistant/#');
    assert.callCount(nukiHandler.mqttService.device.subscribe, 1);
    nukiHandler.mqttService.device.subscribe.firstCall.calledWith(
      'homeassistant/#',
      nukiHandler.handleMessage.bind(nukiHandler),
    );
  });
});
