---
to: test/services/<%= module %>/api/<%= module %>.controller.test.js
---
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { <%= className %>HandlerMock } = require('../mocks/ecovacs.mock.test');

const <%= className %>Service = proxyquire('../../../../services/ecovacs', {
  './lib': <%= className %>HandlerMock,
});

const { assert, fake } = sinon;
const <%= attributeName %>Service = <%= className %>Service({}, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

describe('GET /api/v1/service/<%= module %>/status', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('Get <%= module %> service status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await <%= attributeName %>Service.controllers['get /api/v1/service/<%= module %>/status'].controller(req, res);
    assert.calledOnce(<%= attributeName %>Service.device.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/<%= module %>/config', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('Get <%= module %> configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await <%= attributeName %>Service.controllers['get /api/v1/service/<%= module %>/config'].controller(req, res);
    assert.calledOnce(<%= attributeName %>Service.device.getConfiguration);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/<%= module %>/config', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('Save <%= module %> configuration', async () => {
    const req = {
      body: []
    };
    const res = {
      json: fake.returns(null),
    };

    await <%= attributeName %>Service.controllers['post /api/v1/service/<%= module %>/config'].controller(req, res);
    assert.calledOnce(<%= attributeName %>Service.device.saveConfiguration);
    assert.calledWith(<%= attributeName %>Service.device.saveConfiguration, req.body);
    assert.calledOnce(res.json);
  });
});
