const sinon = require('sinon');
const EweLinkController = require('../../../../services/ewelink/api/ewelink.controller');

const { assert, fake } = sinon;

const status = {};
const devices = [];
const ewelinkHandler = {
  connect: fake.returns(true),
  status: fake.resolves(status),
  discover: fake.returns(devices),
};

describe('EweLinkController POST /api/v1/service/ewelink/connect', () => {
  let controller;

  beforeEach(() => {
    controller = EweLinkController(ewelinkHandler);
    sinon.reset();
  });

  it('should connect', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/ewelink/connect'].controller(req, res);
    assert.calledOnce(ewelinkHandler.connect);
    assert.calledOnce(res.json);
  });
});

describe('EweLinkController GET /api/v1/service/ewelink/status', () => {
  let controller;

  beforeEach(() => {
    controller = EweLinkController(ewelinkHandler);
    sinon.reset();
  });

  it('should return status', async () => {
    status.configured = true;
    status.connected = true;

    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/ewelink/status'].controller(req, res);
    assert.calledOnce(ewelinkHandler.status);
    assert.calledOnce(res.json);
  });
});

describe('EweLinkController GET /api/v1/service/ewelink/discover', () => {
  let controller;

  beforeEach(() => {
    controller = EweLinkController(ewelinkHandler);
    sinon.reset();
  });

  it('should get devices', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controller['get /api/v1/service/ewelink/discover'].controller(req, res);
    assert.calledOnce(ewelinkHandler.discover);
    assert.calledOnce(res.json);
  });
});
