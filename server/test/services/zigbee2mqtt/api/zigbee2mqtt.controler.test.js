const { assert, fake } = require('sinon');
const Zigbee2mqttController = require('../../../../services/zigbee2mqtt/api/zigbee2mqtt.controller');

const zigbee2mqttHandler = {
  discoverDevices: fake.resolves(true),
};

describe('POST /api/v1/service/zigbee2mqtt/discover', () => {
  let controller;

  beforeEach(() => {
    controller = Zigbee2mqttController(zigbee2mqttHandler);
  });

  it('Discover', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/discover'].controller(req, res);
    assert.calledOnce(zigbee2mqttHandler.discoverDevices);
    assert.calledWith(res.json, { status: 'discovering' });
  });
});
