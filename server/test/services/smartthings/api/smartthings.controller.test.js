const sinon = require('sinon');

const { assert, fake } = sinon;
const { expect } = require('chai');
const SmartthingsController = require('../../../../services/smartthings/api/smartthings.controller');

const smartthingsHandler = {
  handleHttpCallback: fake.resolves(true),
  init: fake.resolves(true),
};

const gladys = {
  oauth: {
    authenticate: fake.resolves(true),
  },
};

describe('POST /api/v1/service/smartthings/schema', () => {
  let controller;

  beforeEach(() => {
    controller = SmartthingsController(smartthingsHandler, gladys);
    sinon.reset();
  });

  it('Schema test without auth', async () => {
    const req = { body: {} };
    const res = 'response';

    await controller['post /api/v1/service/smartthings/schema'].controller(req, res);
    assert.calledOnce(gladys.oauth.authenticate);
  });

  it('Schema test with auth', async () => {
    const req = {
      body: {
        authentication: {},
      },
      headers: {},
    };
    const res = 'response';

    await controller['post /api/v1/service/smartthings/schema'].controller(req, res);
    expect(req.headers).to.have.property('authorization');
    assert.calledOnce(gladys.oauth.authenticate);
  });
});

describe('POST /api/v1/service/smartthings/init', () => {
  let controller;

  beforeEach(() => {
    controller = SmartthingsController(smartthingsHandler);
  });

  it('Schame test', async () => {
    const req = 'request';
    const res = {
      status: fake.returns(true),
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/smartthings/init'].controller(req, res);
    assert.calledOnce(smartthingsHandler.init);
    assert.calledOnce(res.status);
    assert.calledOnce(res.json);
  });
});
