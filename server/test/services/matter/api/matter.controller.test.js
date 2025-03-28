const sinon = require('sinon');
const MatterController = require('../../../../services/matter/api/matter.controller');

const { assert, fake } = sinon;

describe('MatterController', () => {
  let controller;
  let matterHandler;

  beforeEach(() => {
    matterHandler = {
      pairDevice: fake.resolves(null),
      getDevices: fake.returns([{ name: 'toto' }]),
      getNodes: fake.returns([{ name: 'toto' }]),
      decommission: fake.resolves(null),
      listenToStateChange: fake.resolves(null),
    };
    controller = MatterController(matterHandler);
    sinon.reset();
  });

  it('should pair a device', async () => {
    const req = {
      body: {
        pairing_code: '123456',
      },
    };
    const res = {
      json: fake.returns([]),
    };

    await controller['post /api/v1/service/matter/pair-device'].controller(req, res);
    assert.calledOnce(matterHandler.pairDevice);
    assert.calledWith(res.json, { success: true });
  });
  it('should get devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/matter/paired-device'].controller(req, res);
    assert.calledOnce(matterHandler.getDevices);
    assert.calledWith(res.json, [{ name: 'toto' }]);
  });
  it('should get nodes', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/matter/node'].controller(req, res);
    assert.calledOnce(matterHandler.getNodes);
    assert.calledWith(res.json, [{ name: 'toto' }]);
  });
  it('should decommission a node', async () => {
    const req = {
      params: {
        node_id: '1234',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/matter/node/:node_id/decommission'].controller(req, res);
    assert.calledOnce(matterHandler.decommission);
    assert.calledWith(res.json, { success: true });
  });
});
