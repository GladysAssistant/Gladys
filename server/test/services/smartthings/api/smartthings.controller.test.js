const { assert, fake } = require('sinon');
const SmartthingsController = require('../../../../services/smartthings/api/smartthings.controller');

const smartthingsHandler = {
  handleHttpCallback: fake.resolves(true),
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
