const sinon = require('sinon');

const { assert, fake } = sinon;
const NodeRedController = require('../../../../services/node-red/api/node-red.controller');

const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
};
const NodeRedManager = {
  status: fake.returns(true),
  init: fake.returns(true),
  installContainer: fake.returns(true),
  disconnect: fake.returns(true),
};

describe('NodeRed API', () => {
  let controller;

  beforeEach(() => {
    controller = NodeRedController(gladys, NodeRedManager, 'de1dd005-092d-456d-93d1-817c9ace4c67');
    sinon.reset();
  });

  it('get /api/v1/service/node-red/status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/node-red/status'].controller(req, res);
    assert.calledOnce(NodeRedManager.status);
    assert.calledWith(res.json, true);
  });

  it('post /api/v1/service/node-red/connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/node-red/connect'].controller(req, res);
    assert.calledOnce(NodeRedManager.init);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/node-red/start', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/node-red/start'].controller(req, res);
    assert.calledOnce(NodeRedManager.installContainer);
    assert.calledWith(res.json, { success: true });
  });

  it('post /api/v1/service/node-red/disconnect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/node-red/disconnect'].controller(req, res);
    assert.calledOnce(NodeRedManager.disconnect);
    assert.calledWith(res.json, { success: true });
  });
});
