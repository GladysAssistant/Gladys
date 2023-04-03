---
to: test/services/<%= module %>/api/<%= module %>.controller.test.js
---
const sinon = require('sinon');
const <%= attributeName %>HandlerMock = require('../mocks/<%= module %>.mock.test.js');

const { assert, fake } = sinon;
const <%= className %>Controller = require('../../../../services/<%= module %>/api/<%= module %>.controller');

describe('GET /api/v1/service/<%= module %>/status', () => {
  let controller;

  beforeEach(() => {
    controller = <%= className %>Controller(<%= attributeName %>HandlerMock);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Get <%= module %> service status', () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/<%= module %>/status'].controller(req, res);
    assert.calledOnce(controller.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/<%= module %>/config', () => {
  let controller;

  beforeEach(() => {
    controller = <%= className %>Controller(<%= attributeName %>HandlerMock);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Get <%= module %> configuration', () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/<%= module %>/config'].controller(req, res);
    assert.calledOnce(<%= attributeName %>HandlerMock.getConfiguration);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/<%= module %>/config', () => {
  let controller;

  beforeEach(() => {
    controller = <%= className %>Controller(<%= attributeName %>HandlerMock);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Save <%= module %> configuration', () => {
    const req = {
      body: []
    };
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/<%= module %>/config'].controller(req, res);
    assert.calledOnce(<%= attributeName %>HandlerMock.saveConfiguration);
    assert.calledWith(<%= attributeName %>HandlerMock.saveConfiguration, req.body);
    assert.calledOnce(res.json);
  });
});
