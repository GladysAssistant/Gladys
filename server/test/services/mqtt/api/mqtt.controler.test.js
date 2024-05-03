const sinon = require('sinon');

const { assert, fake } = sinon;
const MqttController = require('../../../../services/mqtt/api/mqtt.controller');

const configuration = {};
const mqttHandler = {
  status: fake.resolves(true),
  getConfiguration: fake.returns(configuration),
  saveConfiguration: fake.returns(true),
  installContainer: fake.returns(true),
  setDebugMode: fake.returns(null),
};

describe('POST /api/v1/service/mqtt/connect', () => {
  let controller;

  beforeEach(() => {
    controller = MqttController(mqttHandler);
    sinon.reset();
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
    assert.calledWith(mqttHandler.saveConfiguration, req.body);
  });
});

describe('GET /api/v1/service/mqtt/status', () => {
  let controller;

  beforeEach(() => {
    controller = MqttController(mqttHandler);
    sinon.reset();
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
    sinon.reset();
  });

  it('getConfiguration test', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/mqtt/config'].controller(req, res);
    assert.calledOnce(mqttHandler.getConfiguration);
    assert.calledWith(res.json, configuration);
  });

  it('getConfiguration test (hide password)', async () => {
    configuration.useEmbeddedBroker = false;
    configuration.mqttPassword = 'my_password';

    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/mqtt/config'].controller(req, res);
    assert.calledOnce(mqttHandler.getConfiguration);
    assert.calledWith(res.json, {
      useEmbeddedBroker: false,
      mqttPassword: 'my_password',
    });
  });

  it('getConfiguration test (no password)', async () => {
    configuration.useEmbeddedBroker = false;
    configuration.mqttPassword = null;

    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/mqtt/config'].controller(req, res);
    assert.calledOnce(mqttHandler.getConfiguration);
    assert.calledWith(res.json, {
      useEmbeddedBroker: false,
      mqttPassword: null,
    });
  });

  it('getConfiguration test (display password)', async () => {
    configuration.useEmbeddedBroker = true;
    configuration.mqttPassword = 'my_password';

    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/mqtt/config'].controller(req, res);
    assert.calledOnce(mqttHandler.getConfiguration);
    assert.calledWith(res.json, {
      useEmbeddedBroker: true,
      mqttPassword: 'my_password',
    });
  });
});

describe('POST /api/v1/service/mqtt/config/docker', () => {
  let controller;

  beforeEach(() => {
    controller = MqttController(mqttHandler);
    sinon.reset();
  });

  it('Install container', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/mqtt/config/docker'].controller(req, res);
    assert.calledOnce(mqttHandler.installContainer);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/mqtt/debug_mode', () => {
  let controller;

  beforeEach(() => {
    controller = MqttController(mqttHandler);
    sinon.reset();
  });

  it('Set debug mode to true', async () => {
    const req = {
      body: {
        debug_mode: true,
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/mqtt/debug_mode'].controller(req, res);
    assert.calledWith(mqttHandler.setDebugMode, true);
    assert.calledOnce(res.json);
  });
});
