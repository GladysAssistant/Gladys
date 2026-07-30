const { fake, assert } = require('sinon');

const MessageHandler = require('../../../../services/telegram/lib');

describe('Telegram.message.sendToUser', () => {
  it('should resolve the identity itself and send', async () => {
    const messageHandler = new MessageHandler({}, {}, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
    messageHandler.send = fake.resolves(null);
    const message = { text: 'Hello from Gladys!' };
    await messageHandler.sendToUser({ telegram_user_id: 'telegram-user-id' }, message);
    assert.calledWith(messageHandler.send, 'telegram-user-id', message);
  });

  it('should no-op when the user has not linked Telegram', async () => {
    const messageHandler = new MessageHandler({}, {}, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
    messageHandler.send = fake.resolves(null);
    await messageHandler.sendToUser({ telegram_user_id: null }, { text: 'Hello!' });
    assert.notCalled(messageHandler.send);
  });
});
