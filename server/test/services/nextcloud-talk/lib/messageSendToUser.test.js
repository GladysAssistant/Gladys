const { fake, assert } = require('sinon');

const MessageHandler = require('../../../../services/nextcloud-talk/lib');

describe('NextcloudTalk.message.sendToUser', () => {
  it('should resolve the token itself and send', async () => {
    const gladys = { variable: { getValue: fake.resolves('a1z2e3') } };
    const messageHandler = new MessageHandler(gladys, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e', {});
    messageHandler.send = fake.resolves(null);
    const message = { text: 'Hello from Gladys!' };
    await messageHandler.sendToUser({ id: 'user-id' }, message);
    assert.calledWith(
      gladys.variable.getValue,
      'NEXTCLOUD_TALK_TOKEN',
      'a810c3c0-8c79-4e5c-9872-111f1d27d96e',
      'user-id',
    );
    assert.calledWith(messageHandler.send, 'a1z2e3', message);
  });

  it('should no-op when the user has not configured Nextcloud Talk', async () => {
    const gladys = { variable: { getValue: fake.resolves(null) } };
    const messageHandler = new MessageHandler(gladys, 'a810c3c0-8c79-4e5c-9872-111f1d27d96e', {});
    messageHandler.send = fake.resolves(null);
    await messageHandler.sendToUser({ id: 'user-id' }, { text: 'Hello!' });
    assert.notCalled(messageHandler.send);
  });
});
