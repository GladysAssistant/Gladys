const { assert, fake } = require('sinon');
const SmartthingsController = require('../../../../services/smartthings/api/smartthings.controller');

const smartthingsHandler = {
  handleHttpCallback: fake.resolves(true),
  init: fake.resolves(true),
};

describe('POST /api/v1/service/smartthings/schema', () => {
  let controller;

  beforeEach(() => {
    controller = SmartthingsController(smartthingsHandler);
  });

  it('Schame test', async () => {
    const req = 'request';
    const res = 'response';

    await controller['post /api/v1/service/smartthings/schema'].controller(req, res);
    assert.calledWith(smartthingsHandler.handleHttpCallback, req, res);
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
