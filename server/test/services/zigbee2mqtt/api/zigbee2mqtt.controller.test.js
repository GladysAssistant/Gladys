const sinon = require('sinon');

const { assert, fake } = sinon;
const Zigbee2MqttController = require('../../../../services/zigbee2mqtt/api/zigbee2mqtt.controller');

const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
};
const zigbee2mqttManager = {
  getDiscoveredDevices: fake.returns(['device']),
  getManagedAdapters: fake.returns(['adapter']),
  status: fake.returns(true),
  getSetup: fake.resolves({ config: 'values' }),
  setup: fake.resolves(true),
  init: fake.resolves(true),
  installMqttContainer: fake.resolves(true),
  installZ2mContainer: fake.resolves(true),
  disconnect: fake.returns(true),
  setPermitJoin: fake.returns(true),
  getPermitJoin: fake.returns(true),
};

describe('zigbee2mqtt API', () => {
  let controller;

  beforeEach(() => {
    controller = Zigbee2MqttController(gladys, zigbee2mqttManager, 'de1dd005-092d-456d-93d1-817c9ace4c67');
    sinon.reset();
  });

  it('get /api/v1/service/zigbee2mqtt/discovered', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/discovered'].controller(req, res);

    assert.calledOnce(zigbee2mqttManager.getDiscoveredDevices);
    assert.calledWith(res.json, ['device']);
  });

  it('get /api/v1/service/zigbee2mqtt/adapter', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/adapter'].controller(req, res);

    assert.calledOnce(zigbee2mqttManager.getManagedAdapters);
    assert.calledWith(res.json, ['adapter']);
  });

  it('get /api/v1/service/zigbee2mqtt/status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/status'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.status);
    assert.calledWith(res.json, true);
  });

  it('get /api/v1/service/zigbee2mqtt/setup', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/setup'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.getSetup);
    assert.calledOnceWithExactly(res.json, { config: 'values' });
  });

  it('post /api/v1/service/zigbee2mqtt/setup', async () => {
    const req = {
      body: { attr: 'value' },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/setup'].controller(req, res);
    assert.calledOnceWithExactly(zigbee2mqttManager.setup, req.body);
    assert.calledOnceWithExactly(res.json, { config: 'values' });
  });

  it('post /api/v1/service/zigbee2mqtt/connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/connect'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.init);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/zigbee2mqtt/mqtt/start', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/mqtt/start'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.installMqttContainer);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/zigbee2mqtt/z2m/start', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/z2m/start'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.installZ2mContainer);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/zigbee2mqtt/disconnect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/disconnect'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.disconnect);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/zigbee2mqtt/permit_join', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/permit_join'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.setPermitJoin);
    assert.calledWith(res.json, { success: true });
  });

  it('get /api/v1/service/zigbee2mqtt/permit_join', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/zigbee2mqtt/permit_join'].controller(req, res);
    assert.calledOnce(zigbee2mqttManager.getPermitJoin);
    assert.calledWith(res.json, true);
  });
});
