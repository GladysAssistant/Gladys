const sinon = require('sinon');

const { assert, fake } = sinon;
const EcovacsController = require('../../../../services/ecovacs/api/ecovacs.controller');

const ecovacsHandler = {
  getStatus: fake.resolves(true),
  getConfiguration: fake.resolves(true),
  saveConfiguration: fake.resolves(true),
};


describe('GET /api/v1/service/ecovacs/status', () => {
  let controller;

  beforeEach(() => {
    controller = EcovacsController(ecovacsHandler);
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Get ecovacs service status', () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/ecovacs/status'].controller(req, res);
    assert.calledOnce(ecovacsHandler.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/ecovacs/config', () => {
  let controller;

  beforeEach(() => {
    controller = EcovacsController(ecovacsHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Get ecovacs configuration', () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/ecovacs/config'].controller(req, res);
    assert.calledOnce(ecovacsHandler.getConfiguration);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/ecovacs/config', () => {
  let controller;

  beforeEach(() => {
    controller = EcovacsController(ecovacsHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Save ecovacs configuration', () => {
    const req = {
      body: []
    };
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/ecovacs/config'].controller(req, res);
    assert.calledOnce(ecovacsHandler.saveConfiguration);
    assert.calledWith(ecovacsHandler.saveConfiguration, req.body);
    assert.calledOnce(res.json);
  });
});
