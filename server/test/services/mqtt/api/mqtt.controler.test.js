const { assert, fake } = require('sinon');
const MqttController = require('../../../../services/mqtt/api/mqtt.controller');

const mqttHandler = {
  connect: fake.resolves(true),
  status: fake.resolves(true),
  getConfiguration: fake.resolves(true),
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
  });
});

describe('GET /api/v1/service/mqtt/status', () => {
  let controller;

  beforeEach(() => {
    controller = MqttController(mqttHandler);
  });

  it('Status test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/mqtt/status'].controller(req, res);
    assert.calledOnce(mqttHandler.status);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/mqtt/config', () => {
  let controller;

  beforeEach(() => {
    controller = MqttController(mqttHandler);
  });

  it('getConfiguration test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/mqtt/config'].controller(req, res);
    assert.calledOnce(mqttHandler.getConfiguration);
  });
});
