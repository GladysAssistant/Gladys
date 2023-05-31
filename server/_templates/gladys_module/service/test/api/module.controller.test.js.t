---
to: test/services/<%= module %>/api/<%= module %>.controller.test.js
---
const sinon = require('sinon');
const { <%= className %>HandlerMock } = require('../mocks/<%= module %>.mock.test');
const { serviceId } = require('../mocks/consts.test');

const <%= className %>Controller = require('../../../../services/<%= module %>/api/<%= module %>.controller');

const { assert, fake } = sinon;

let controllers;
let <%= attributeName %>Handler;

describe('GET /api/v1/service/<%= module %>/status', () => {
  beforeEach(() => {
    sinon.reset();
    <%= attributeName %>Handler = new <%= className %>HandlerMock({}, serviceId);
    controllers = <%= className %>Controller(<%= attributeName %>Handler);
  });

  it('Get <%= module %> service status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controllers['get /api/v1/service/<%= module %>/status'].controller(req, res);
    assert.calledOnce(<%= attributeName %>Handler.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/<%= module %>/config', () => {
  beforeEach(() => {
    sinon.reset();
    <%= attributeName %>Handler = new <%= className %>HandlerMock({}, serviceId);
    controllers = <%= className %>Controller(<%= attributeName %>Handler);
  });

  it('Get <%= module %> configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controllers['get /api/v1/service/<%= module %>/config'].controller(req, res);
    assert.calledOnce(<%= attributeName %>Handler.getConfiguration);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/<%= module %>/config', () => {
  beforeEach(() => {
    sinon.reset();
    <%= attributeName %>Handler = new <%= className %>HandlerMock({}, serviceId);
    controllers = <%= className %>Controller(<%= attributeName %>Handler);
  });

  it('Save <%= module %> configuration', async () => {
    const req = {
      body: []
    };
    const res = {
      json: fake.returns(null),
    };

    await controllers['post /api/v1/service/<%= module %>/config'].controller(req, res);
    assert.calledOnce(<%= attributeName %>Handler.saveConfiguration);
    assert.calledWith(<%= attributeName %>Handler.saveConfiguration, req.body);
    assert.calledOnce(res.json);
  });
});
