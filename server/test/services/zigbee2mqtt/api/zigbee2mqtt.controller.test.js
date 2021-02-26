const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const Zigbee2MqttController = require('../../../../services/zigbee2mqtt/api/zigbee2mqtt.controller');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
};
const zigbee2mqttManager = {
  discoverDevices: fake.resolves(true),
  status: fake.returns(true),
  init: fake.returns(true),
  installMqttContainer: fake.returns(true),
  installZ2mContainer: fake.returns(true),
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

  it('post /api/v1/service/zigbee2mqtt/discover', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/zigbee2mqtt/discover'].controller(req, res);

    assert.calledOnce(zigbee2mqttManager.discoverDevices);
    assert.calledWith(res.json, { status: 'discovering' });
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
    assert.calledWith(res.json, true);
  });

  it('post /api/v1/service/zigbee2mqtt/mqtt/start error', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const error = new Error('error');
    zigbee2mqttManager.installMqttContainer = fake.throws(error);
    try {
      await controller['post /api/v1/service/zigbee2mqtt/mqtt/start'].controller(req, res);
    } catch (e) {
      expect(e).to.be.eq(error);
      assert.calledOnce(zigbee2mqttManager.installMqttContainer);
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT_ERROR,
        payload: error,
      });
      assert.calledWith(res.json, false);
    }
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
