const { fake, assert } = require('sinon');

const MessageHandler = require('../../../../services/callmebot/lib');

describe('CallMeBot.message.sendToUser', () => {
  it('should delegate to send with the user id', async () => {
    const messageHandler = new MessageHandler({}, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e');
    messageHandler.send = fake.resolves(null);
    const message = { text: 'Hello from Gladys!' };
    await messageHandler.sendToUser({ id: 'user-id' }, message);
    assert.calledWith(messageHandler.send, 'user-id', message);
  });
});
