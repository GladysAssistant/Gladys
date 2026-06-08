const { assert, fake } = require('sinon');
const { expect } = require('chai');
const Brain = require('../../../lib/brain');
const MessageHandler = require('../../../lib/message');
const { EVENTS } = require('../../../utils/constants');

describe('message.create end-to-end tests', () => {
  const brain = new Brain();
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
  const messageHandler = new MessageHandler(event, brain, service, {}, variable);

  before('should train brain & add room', async () => {
    await brain.train();
    await brain.addNamedEntity('room', '39332b3e-2e4a-465c-b049-b20cafb592ae', 'kitchen');
  });

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
