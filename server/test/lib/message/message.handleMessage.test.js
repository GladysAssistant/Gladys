const { assert, fake } = require('sinon');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

const message = {
  id: '247b1dd0-6fab-47a8-a9c8-1405deae0ae8',
  text: 'Hello Gladys',
  language: 'fr',
  source: 'conversation',
  source_user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
  user: {
    id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    language: 'fr',
  },
};

describe('message.handleEvent', () => {
  const eventEmitter = new EventEmitter();
  eventEmitter.emit = fake.resolves(null);
  const messageHandler = new MessageHandler(eventEmitter);
  messageHandler.create = fake.resolves(null);

  it('should handle message', async () => {
    // EXECUTE
    await messageHandler.handleEvent(message);

    // ASSERT
    assert.calledWith(eventEmitter.emit, EVENTS.WEBSOCKET.SEND, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.SENT,
      payload: message,
      userId: message.source_user_id,
    });
    assert.calledWith(messageHandler.create, message);
  });
});
