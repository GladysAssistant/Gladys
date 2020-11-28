const sinon = require('sinon');

const { assert, fake } = sinon;
const { expect } = require('chai');
const GoogleActionsController = require('../../../../services/google-actions/api/googleActions.controller');

const googleActionsHandler = {
  smarthome: fake.resolves(true),
  storeParams: fake.resolves(true),
  init: fake.resolves(true),
};

describe('POST /api/v1/service/google-actions/smarthome', () => {
  let controller;

  beforeEach(() => {
    controller = GoogleActionsController(googleActionsHandler);
    sinon.reset();
  });

  it('Smarthome', async () => {
    const req = {
      body: {},
      user: 'user',
    };
    const res = 'response';

    await controller['post /api/v1/service/google-actions/smarthome'].controller(req, res);
    assert.calledOnce(googleActionsHandler.smarthome);
    expect(req.body.user).to.eq('user');
  });
});

describe('POST /api/v1/service/google-actions/init', () => {
  let controller;

  beforeEach(() => {
    controller = GoogleActionsController(googleActionsHandler);
  });

  it('Init test', async () => {
    const req = {
      body: {},
    };
    const res = {
      json: fake.returns(null),
    };

    await controller['post /api/v1/service/google-actions/init'].controller(req, res);
    assert.calledOnce(googleActionsHandler.storeParams);
    assert.calledOnce(googleActionsHandler.init);
    assert.calledOnce(res.json);
  });
});
