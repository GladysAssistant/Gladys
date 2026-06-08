const { assert, fake } = require('sinon');
const { expect } = require('chai');
const MessageHandler = require('../../../lib/message');
const { EVENTS } = require('../../../utils/constants');

describe('message.create end-to-end tests', () => {
  const event = {
    emit: fake.returns(null),
    on: fake.returns(null),
  };
  const service = {
    getService: fake.returns(null),
  };
  const variable = {
    getValue: fake.resolves('configured-value'),
  };
  const brain = {
    getReply: () => 'Gladys Plus required',
  };
  const messageHandler = new MessageHandler(event, brain, service, {}, variable);

  it('should forward message to Gladys Plus AI when gateway is configured', async () => {
    await messageHandler.create({
      text: 'Turn on the light in the kitchen',
      language: 'en',
      source: 'client-api',
      source_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
        language: 'en',
      },
      id: '5cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    assert.calledWith(event.emit, EVENTS.MESSAGE.NEW_FOR_OPEN_AI);
    const callArgs = event.emit.getCall(0).args;
    expect(callArgs[1]).to.have.property('message');
    expect(callArgs[1].context).to.deep.equal({
      user: { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5', language: 'en' },
    });
  });
});
