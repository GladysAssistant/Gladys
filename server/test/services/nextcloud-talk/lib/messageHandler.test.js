const { expect } = require('chai');
const { fake } = require('sinon');

const MessageHandler = require('../../../../services/nextcloud-talk/lib');
const { EVENTS } = require('../../../../utils/constants');

const gladys = {
  user: {
    getById: fake.resolves({
      id: '30385cbf-b9ff-4239-a6bb-35477ca3eea6',
      language: 'fr',
    }),
  },
  event: {
    emit: fake.resolves(),
  },
  variable: {
    getValue: fake.resolves('test-value'),
  },
  http: {},
};

describe('NextcloudTalk.message', () => {
  const messageHandler = new MessageHandler(gladys, 'a03a5e92-236a-4465-9bd5-530247d76959');
  it('should connect', async () => {
    gladys.http.request = fake.resolves({
      headers: {
        'x-chat-last-given': 1,
      },
      data: {
        ocs: {
          data: [{ id: 2, actorId: 'userbot' }],
        },
      },
    });
    messageHandler.bots = {};
    await messageHandler.connect([{ value: 'testToken1', user_id: '30385cbf-b9ff-4239-a6bb-35477ca3eea6' }]);
    expect(messageHandler.bots['30385cbf-b9ff-4239-a6bb-35477ca3eea6'].token).eq('testToken1');
  });
  it('should poll once', async () => {
    const emit = fake.resolves();
    messageHandler.bots.testToken2 = {
      lastKnownMessageId: 2,
      isPolling: true,
      eventEmitter: {
        emit,
      },
    };
    await messageHandler.poll('testToken2');
    expect(emit.args[0][0]).eq('message');
    expect(emit.args[0][1]).eql({ id: 2, actorId: 'userbot' });
  });
  it('should stop polling', async () => {
    messageHandler.bots.testToken3 = {
      lastKnownMessageId: 2,
      isPolling: true,
    };
    await messageHandler.stopPolling('testToken3');
    expect(messageHandler.bots.testToken3.isPolling).equal(false);
  });
  it('should handle new message', async () => {
    const msg = {
      id: 213,
      token: 'testToken1',
      actorType: 'users',
      actorId: 'tony',
      timestamp: 1638000000,
      message: 'Hey!',
    };
    await messageHandler.newMessage(msg);
    expect(gladys.event.emit.args[0][0]).eq(EVENTS.MESSAGE.NEW);
    expect(gladys.event.emit.args[0][1]).contains({
      source: 'nextcloud-talk',
      source_user_id: msg.token,
      user_id: '30385cbf-b9ff-4239-a6bb-35477ca3eea6',
      language: 'fr',
      created_at: '2021-11-27T08:00:00.000Z',
      text: msg.message,
    });
  });
  it('should send message', async () => {
    gladys.http.request = fake.resolves({});
    await messageHandler.send('testToken1', {
      text: 'Hey',
    });
    expect(gladys.http.request.callCount).eq(1);
  });
  it('should send message with image', async () => {
    gladys.http.request = fake.resolves({});
    await messageHandler.send('testToken1', {
      text: 'Hey',
      file: 'abase64fiulessdfdksjfksdljflskjfklsjflksjfldksjlkjfkjklj',
    });
    expect(gladys.http.request.callCount).eq(3);
  });
});
