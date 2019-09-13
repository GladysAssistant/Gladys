const { assert, fake } = require('sinon');
const MqttController = require('../../../../services/mqtt/api/mqtt.controller');

const mqttHandler = {
  connect: fake.resolves(true),
};

describe('POST /api/v1/service/mqtt/connect', () => {
  let controller;

  beforeEach(() => {
    controller = MqttController(mqttHandler);
  });

  it('Connect test', async () => {
    const req = {
      body: {
        mqttURL: 'url',
        mqttUsername: 'username',
        mqttPassword: 'password',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/mqtt/connect'].controller(req, res);
    assert.calledWith(mqttHandler.connect, 'url', 'username', 'password');
    assert.calledOnce(res.json);
  });
});
