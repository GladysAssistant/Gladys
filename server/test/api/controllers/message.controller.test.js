const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const MessageController = require('../../../api/controllers/message.controller');
const { EVENTS } = require('../../../utils/constants');

describe('message.controller local AI provider', () => {
  afterEach(() => {
    delete process.env.BOBS_HOME_AI_PROVIDER;
  });

  it('should ignore a stale Gateway model when OmniRoute selects the model', async () => {
    process.env.BOBS_HOME_AI_PROVIDER = 'openjarvis';
    const emit = sinon.fake();
    const controller = MessageController({ event: { emit } });
    const req = {
      body: { text: 'Turn on the light', model: 'mistral-small-3.2-24b-instruct-2506' },
      user: { id: 'user-id', language: 'en' },
    };
    const json = sinon.fake();
    const res = { status: sinon.stub().returns({ json }) };
    await controller.create(req, res, sinon.fake());
    expect(emit.calledOnce).to.equal(true);
    expect(emit.firstCall.args[0]).to.equal(EVENTS.MESSAGE.NEW);
    expect(emit.firstCall.args[1]).to.not.have.property('model');
  });

  it('should accept an unknown legacy model in local mode without sending it', async () => {
    process.env.BOBS_HOME_AI_PROVIDER = 'openjarvis';
    const emit = sinon.fake();
    const controller = MessageController({ event: { emit } });
    const req = { body: { text: 'Hi', model: 'unknown' }, user: { id: 'user-id', language: 'en' } };
    const res = { status: sinon.stub().returns({ json: sinon.fake() }) };
    await controller.create(req, res, sinon.fake());
    expect(emit.firstCall.args[1]).to.not.have.property('model');
  });
});
