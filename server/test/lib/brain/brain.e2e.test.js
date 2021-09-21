const { assert, fake } = require('sinon');
const { expect } = require('chai');
const Brain = require('../../../lib/brain');
const MessageHandler = require('../../../lib/message');
const { EVENTS, INTENTS } = require('../../../utils/constants');

describe('brain end-to-end tests', () => {
  const brain = new Brain();
  const event = {
    emit: fake.returns(),
    on: fake.returns(),
  };
  const service = {
    getService: fake.returns(null),
  };
  const messageHandler = new MessageHandler(event, brain, service);
  before('should train brain & add room', async () => {
    await brain.train();
    await brain.addRoom({
      id: '39332b3e-2e4a-465c-b049-b20cafb592ae',
      name: 'kitchen',
    });
  });
  it('should handle message', async () => {
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
    assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND);
    assert.calledWith(event.emit, INTENTS.LIGHT.TURN_ON);
    const callArgs = event.emit.getCall(1).args;
    const [, , nlpJsClassification, nlpJsContext] = callArgs;
    expect(nlpJsContext).to.deep.equal({
      user: { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5', language: 'en' },
      entities: {
        room: {
          start: 25,
          end: 31,
          len: 7,
          levenshtein: 0,
          accuracy: 1,
          entity: 'room',
          type: 'enum',
          option: '39332b3e-2e4a-465c-b049-b20cafb592ae',
          sourceText: 'kitchen',
          utteranceText: 'kitchen',
        },
      },
      room: 'kitchen',
      slotFill: undefined,
    });
    expect(nlpJsClassification.entities).to.deep.equal([
      {
        start: 25,
        end: 31,
        len: 7,
        levenshtein: 0,
        accuracy: 1,
        entity: 'room',
        type: 'enum',
        option: '39332b3e-2e4a-465c-b049-b20cafb592ae',
        sourceText: 'kitchen',
        utteranceText: 'kitchen',
      },
    ]);
    expect(nlpJsClassification).to.have.property('intent', 'light.turn-on');
  });
});
