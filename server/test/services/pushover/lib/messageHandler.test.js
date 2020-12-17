const { fake } = require('sinon');
const EventEmitter = require('events');

const MessageHandler = require('../../../../services/pushover/lib');

const gladys = {
  user: {
    update: fake.resolves(null),
  },
  cache: {
    set: fake.returns(null),
    get: fake.returns('7439f28c-2993-4369-b4e9-59ca0cf2af5e'),
  },
  event: new EventEmitter(),
};

describe('Pushover.message', () => {
  const messageHandler = new MessageHandler(gladys, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
  it('should setup', () => {
    messageHandler.setup('test', 'test');
  });

  it('should send message', async () => {
    await messageHandler.send('chatId', 'serviceName', {
      text: 'Hey',
    });
  });
});
