const sinon = require('sinon');

const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

const mqttService = {
  device: {
    publish: fake.returns(true),
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

  it('should publish command to device mqtt topic', async () => {
    const topic = '123';
    const command = 'on';
    const value = 'true';
    nukiHandler.setValue(device, command, value);
    assert.callCount(nukiHandler.mqttService.device.publish, 1);
    nukiHandler.mqttService.device.publish.firstCall.calledWith(`nuki/${topic}/${command}`, `true`);
  });
});
