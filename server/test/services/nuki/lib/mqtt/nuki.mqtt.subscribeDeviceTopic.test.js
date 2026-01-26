const sinon = require('sinon');

const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

const mqttService = {
  device: {
    subscribe: fake.returns(true),
  },
};

const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
};

const device = {
  external_id: 'nuki:398172F4:button',
};

describe('nuki.mqtt.setValue command', () => {
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

  it('should subscribe to device mqtt topic', async () => {
    nukiHandler.subscribeDeviceTopic(device);
    const topic = 'nuki/398172F4/#';
    assert.callCount(nukiHandler.mqttService.device.subscribe, 1);
    nukiHandler.mqttService.device.subscribe.firstCall.calledWith(
      `${topic}`,
      nukiHandler.handleMessage.bind(nukiHandler),
    );
  });
});
