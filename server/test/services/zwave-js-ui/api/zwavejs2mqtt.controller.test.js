const sinon = require('sinon');

const { assert, fake } = sinon;
const ZwaveJSUIController = require('../../../../services/zwave-js-ui/api/zwavejsui.controller');

const ZWAVEJSUI_SERVICE_ID = 'ZWAVEJSUI_SERVICE_ID';
const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
};
const zwaveJSUIManager = {};

let zwaveJSUIController;

describe('GET /api/v1/service/zwave-js-ui', () => {
  beforeEach(() => {
    zwaveJSUIController = ZwaveJSUIController(gladys, zwaveJSUIManager, ZWAVEJSUI_SERVICE_ID);
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
    zwaveJSUIManager.getStatus = fake.returns(status);
    await zwaveJSUIController['get /api/v1/service/zwave-js-ui/status'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.getStatus);
    assert.calledOnceWithExactly(res.json, status);
  });

  it('should get configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    const configuration = {};
    zwaveJSUIManager.getConfiguration = fake.returns(configuration);
    await zwaveJSUIController['get /api/v1/service/zwave-js-ui/configuration'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.getConfiguration);
    assert.calledOnceWithExactly(res.json, configuration);
  });

  it('should update configuration', async () => {
    const req = {
      body: {
        externalZwaveJSUI: 'externalZwaveJSUI',
        driverPath: 'driverPath',
      },
    };
    const result = true;
    const res = {
      json: fake.returns(null),
    };
    zwaveJSUIManager.updateConfiguration = fake.returns(result);
    zwaveJSUIManager.connect = fake.returns(null);
    await zwaveJSUIController['post /api/v1/service/zwave-js-ui/configuration'].controller(req, res);
    assert.calledOnceWithExactly(zwaveJSUIManager.updateConfiguration, req.body);
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
    zwaveJSUIManager.getNodes = fake.returns(nodes);
    await zwaveJSUIController['get /api/v1/service/zwave-js-ui/node'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.getNodes);
    assert.calledOnceWithExactly(res.json, nodes);
  });

  it('should connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwaveJSUIManager.connect = fake.returns(null);
    await zwaveJSUIController['post /api/v1/service/zwave-js-ui/connect'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.connect);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });

  it('should disconnect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwaveJSUIManager.disconnect = fake.returns(null);
    await zwaveJSUIController['post /api/v1/service/zwave-js-ui/disconnect'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.disconnect);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
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
    zwaveJSUIManager.addNode = fake.returns(null);
    await zwaveJSUIController['post /api/v1/service/zwave-js-ui/node/add'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.addNode);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });

  it('should remove node', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwaveJSUIManager.removeNode = fake.returns(null);
    await zwaveJSUIController['post /api/v1/service/zwave-js-ui/node/remove'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.removeNode);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });

  it('should scanh network', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwaveJSUIManager.scanNetwork = fake.returns(null);
    await zwaveJSUIController['post /api/v1/service/zwave-js-ui/scan'].controller(req, res);
    assert.calledOnce(zwaveJSUIManager.scanNetwork);
    assert.calledOnceWithExactly(res.json, {
      success: true,
    });
  });
});
