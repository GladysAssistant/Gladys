const { assert, fake } = require('sinon');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');

let send;

// mocks
const classification = { intent: 'light.turnon', entities: [{ hey: 1 }] };
const brain = {
  classify: () => Promise.resolve({ classification }),
};
const service = {
  getService: () => {
    send = fake.resolves(true);
    return {
      message: {
        send,
      },
    };
  },
};

describe('message.reply', () => {
  const eventEmitter = new EventEmitter();
  const messageHandler = new MessageHandler(eventEmitter, brain, service);
  it('should send reply', async () => {
    await messageHandler.reply(
      {
        language: 'en',
        source: 'api-client',
        source_user_id: 'XXXX',
        user: {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          language: 'en',
        },
      },
      'hey!',
      {},
    );
    assert.calledWith(send, 'XXXX');
  });
});
