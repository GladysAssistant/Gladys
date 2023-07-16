const { expect } = require('chai');
const { fake, useFakeTimers, spy, stub } = require('sinon');
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
    emit: fake.resolves(null),
  },
  variable: {
    getValue: stub().resolves('test-value'),
  },
  http: {},
};

const axios = {
  request: stub().resolves({}),
};

describe('NextcloudTalk.message', () => {
  const messageHandler = new MessageHandler(gladys, 'a03a5e92-236a-4465-9bd5-530247d76959', axios);
  it('should connect', async () => {
    messageHandler.bots = {
      '30385cbf-b9ff-4239-a6bb-35477ca3eea6': {
        eventEmitter: {
          removeListener: stub().resolves(),
        },
      },
    };
    gladys.variable.getValue = stub()
      .onCall(0)
      .resolves(null);
    gladys.variable.getValue.resolves('test-value');
    axios.request = stub()
      .onCall(0)
      .resolves({ status: 404 })
      .onCall(1)
      .rejects();
    axios.request.resolves({});
    await messageHandler.connect([
      { value: 'testTokenNoURL', user_id: 'ecae21a5-76c5-4820-8a1e-31f567ab517f' },
      { value: 'testTokenWrongStatus', user_id: 'de996034-ddcd-4058-9e6e-ff6839c2a1ec' },
      { value: 'testTokenErrorRequest', user_id: 'ab477b0e-8426-433f-972d-4a29bc471043' },
      { value: 'testToken1', user_id: '30385cbf-b9ff-4239-a6bb-35477ca3eea6' },
      { value: '', user_id: '44ea8fd1-c7c3-4e03-acff-3b102b23188d' },
    ]);
    expect(messageHandler.bots['30385cbf-b9ff-4239-a6bb-35477ca3eea6'].token).eq('testToken1');
  });
  it('should poll once', async () => {
    axios.request.resolves({
      headers: {
        'x-chat-last-given': 1,
      },
      data: {
        ocs: {
          data: [{ id: 2, actorId: 'userbot' }],
        },
      },
    });
    const emit = fake.resolves(null);
    messageHandler.bots.user2 = {
      token: 'testToken2',
      lastKnownMessageId: 2,
      isPolling: true,
      eventEmitter: {
        emit,
      },
    };
    await messageHandler.poll('user2');
    expect(emit.args[0][0]).eq('message');
    expect(emit.args[0][1]).eql({ id: 2, actorId: 'userbot' });
  });
  it('should poll failed due to status', async () => {
    const clock = useFakeTimers();
    const setTimeoutSpy = spy(clock, 'setTimeout');
    axios.request.resolves({
      status: 404,
    });
    const emit = fake.resolves(null);
    messageHandler.bots.user2 = {
      token: 'testToken2',
      lastKnownMessageId: 2,
      isPolling: true,
      eventEmitter: {
        emit,
      },
    };
    await messageHandler.poll('user2');
    expect(setTimeoutSpy.args[0][1]).eq(15000);
    expect(emit.callCount).eq(0);
    clock.restore();
  });
  it('should poll failed due to error on request', async () => {
    const clock = useFakeTimers();
    const setTimeoutSpy = spy(clock, 'setTimeout');
    axios.request.rejects({});
    const emit = fake.resolves(null);
    messageHandler.bots.user2 = {
      token: 'testToken2',
      lastKnownMessageId: 2,
      isPolling: true,
      eventEmitter: {
        emit,
      },
    };
    await messageHandler.poll('user2');
    expect(setTimeoutSpy.args[0][1]).eq(15000);
    expect(emit.callCount).eq(0);
    clock.restore();
  });
  it('should stop polling', async () => {
    messageHandler.bots.user3 = {
      lastKnownMessageId: 2,
      isPolling: true,
      eventEmitter: {
        removeListener: stub().resolves(),
      },
    };
    await messageHandler.stopPolling('user3');
    expect(messageHandler.bots.user3.isPolling).equal(false);
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
  it('should not send message if wrong configuration', async () => {
    gladys.http.request = fake.resolves({});
    gladys.variable.getValue.resolves(null);
    await messageHandler.send('testToken1', {
      text: 'Hey',
    });
    expect(gladys.http.request.callCount).eq(0);
  });
});
