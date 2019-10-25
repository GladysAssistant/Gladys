const sinon = require('sinon');

const { assert, fake } = sinon;
const Zigbee2mqttHandler = require('../../../../services/zigbee2mqtt/lib');

const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};

describe('Zigbee2mqtt discoverDevices', () => {
  const zigbee2mqttHandler = new Zigbee2mqttHandler({}, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  zigbee2mqttHandler.mqttService = mqttService;

  it('discover', () => {
    zigbee2mqttHandler.discoverDevices();

    assert.calledWith(mqttService.device.publish, 'zigbee2mqtt/bridge/config/devices/get');
  });
});
