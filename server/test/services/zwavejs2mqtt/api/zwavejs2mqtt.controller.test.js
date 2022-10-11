const sinon = require('sinon');

const { assert, fake } = sinon;
const Zwavejs2mqttController = require('../../../../services/zwavejs2mqtt/api/zwavejs2mqtt.controller');

const ZWAVEJS2MQTT_SERVICE_ID = 'ZWAVEJS2MQTT_SERVICE_ID';
const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
};
const zwavejs2mqttManager = {};

let zwavejs2mqttController;

describe('GET /api/v1/service/zwavejs2mqtt', () => {
  beforeEach(() => {
    zwavejs2mqttController = Zwavejs2mqttController(gladys, zwavejs2mqttManager, ZWAVEJS2MQTT_SERVICE_ID);
    sinon.reset();
  });

  it('should get status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const status = {
      mqttConnected: false,
      scanInProgress: false,
    };
    zwavejs2mqttManager.getStatus = fake.returns(status);
    await zwavejs2mqttController['get /api/v1/service/zwavejs2mqtt/status'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.getStatus);
    assert.calledOnceWithExactly(res.json, status);
  });

  it('should get configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const configuration = {};
    zwavejs2mqttManager.getConfiguration = fake.returns(configuration);
    await zwavejs2mqttController['get /api/v1/service/zwavejs2mqtt/configuration'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.getConfiguration);
    assert.calledOnceWithExactly(res.json, configuration);
  });

  it('should update configuration', async () => {
    const req = {
      body: {
        externalZwavejs2mqtt: 'externalZwavejs2mqtt',
        driverPath: 'driverPath',
      },
    };
    const result = true;
    const res = {
      json: fake.returns(null),
    };
    zwavejs2mqttManager.updateConfiguration = fake.returns(result);
    zwavejs2mqttManager.connect = fake.returns(null);
    await zwavejs2mqttController['post /api/v1/service/zwavejs2mqtt/configuration'].controller(req, res);
    assert.calledOnceWithExactly(zwavejs2mqttManager.updateConfiguration, req.body);
    assert.calledOnce(zwavejs2mqttManager.connect);
    assert.calledOnceWithExactly(res.json, {
      success: result,
    });
  });

  it('should get nodes', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const nodes = [];
    zwavejs2mqttManager.getNodes = fake.returns(nodes);
    await zwavejs2mqttController['get /api/v1/service/zwavejs2mqtt/node'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.getNodes);
    assert.calledOnceWithExactly(res.json, nodes);
  });

  it('should connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwavejs2mqttManager.connect = fake.returns(null);
    await zwavejs2mqttController['post /api/v1/service/zwavejs2mqtt/connect'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.connect);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });

  it('should disconnect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwavejs2mqttManager.disconnect = fake.returns(null);
    await zwavejs2mqttController['post /api/v1/service/zwavejs2mqtt/disconnect'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.disconnect);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });

  it('should get neighbors', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const nodes = [];
    zwavejs2mqttManager.getNodeNeighbors = fake.returns(nodes);
    await zwavejs2mqttController['get /api/v1/service/zwavejs2mqtt/neighbor'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.getNodeNeighbors);
    assert.calledOnceWithExactly(res.json, nodes);
  });

  it('should add node', async () => {
    const req = {
      body: {
        secure: false,
      },
    };
    const res = {
      json: fake.returns(null),
    };
    zwavejs2mqttManager.addNode = fake.returns(null);
    await zwavejs2mqttController['post /api/v1/service/zwavejs2mqtt/node/add'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.addNode);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });

  it('should remove node', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwavejs2mqttManager.removeNode = fake.returns(null);
    await zwavejs2mqttController['post /api/v1/service/zwavejs2mqtt/node/remove'].controller(req, res);
    assert.calledOnce(zwavejs2mqttManager.removeNode);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });
});
