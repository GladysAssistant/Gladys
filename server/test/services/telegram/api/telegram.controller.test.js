const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;
const TelegramController = require('../../../../services/telegram/api/telegram.controller');

const messageHandler = {
  getCustomLink: fake.resolves('https://telegram.me/faketelegrambot?start=apiKey'),
  disable: fake.resolves(null),
};

describe('GET /api/v1/service/telegram/link', () => {
  let controller;

  beforeEach(() => {
    controller = TelegramController(messageHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get the custom link of the current user', async () => {
    const req = { user: { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' } };
    const res = { json: fake.returns(null) };

    await controller['get /api/v1/service/telegram/link'].controller(req, res);

    assert.calledWith(messageHandler.getCustomLink, '0cd30aef-9c4e-4a23-88e3-3547971296e5');
    assert.calledWith(res.json, { link: 'https://telegram.me/faketelegrambot?start=apiKey' });
  });
});

describe('POST /api/v1/service/telegram/disable', () => {
  let controller;

  beforeEach(() => {
    controller = TelegramController(messageHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should only be reachable by an authenticated admin', () => {
    const route = controller['post /api/v1/service/telegram/disable'];
    expect(route.authenticated).to.equal(true);
    expect(route.admin).to.equal(true);
  });

  it('should disable the telegram integration', async () => {
    const req = { user: { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' } };
    const res = { json: fake.returns(null) };

    await controller['post /api/v1/service/telegram/disable'].controller(req, res);

    assert.calledOnce(messageHandler.disable);
    assert.calledWith(res.json, { success: true });
  });

  it('should forward the error when disabling fails', async () => {
    const failingMessageHandler = {
      getCustomLink: fake.resolves(null),
      disable: fake.rejects(new Error('Unable to disable')),
    };
    const failingController = TelegramController(failingMessageHandler);
    const req = { user: { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' } };
    const res = { json: fake.returns(null) };
    const next = fake.returns(null);

    await failingController['post /api/v1/service/telegram/disable'].controller(req, res, next);

    assert.notCalled(res.json);
    assert.calledOnce(next);
    expect(next.firstCall.args[0]).to.be.an('error');
  });
});
