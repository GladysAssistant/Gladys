const sinon = require('sinon');

const { assert, fake } = sinon;
const Zigbee2mqttHandler = require('../../../../services/zigbee2mqtt/lib');

const mqttService = {
  device: {
    subscribe: fake.returns(null),
  },
};

const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
};

describe('Zigbee2mqtt connect', () => {
  const zigbee2mqttHandler = new Zigbee2mqttHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  zigbee2mqttHandler.mqttService = mqttService;

  it('connect', () => {
    zigbee2mqttHandler.connect();

    assert.calledWith(gladys.service.getService, 'mqtt');
    assert.calledWith(mqttService.device.subscribe, 'zigbee2mqtt/#');
  });
});
