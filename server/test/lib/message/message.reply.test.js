const { expect } = require('chai');
const { assert, fake } = require('sinon');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');

describe('message.reply', () => {
  const eventEmitter = new EventEmitter();
  let messageHandler;
  let telegramService;
  let nextCloudTalkService;
  let callmebotService;
  let apiClientSource;
  let variable;
  beforeEach(() => {
    telegramService = {
      message: {
        send: fake.resolves(null),
      },
    };

    nextCloudTalkService = {
      message: {
        send: fake.resolves(null),
      },
    };

    callmebotService = {
      message: {
        send: fake.resolves(null),
      },
    };

    apiClientSource = {
      message: {
        send: fake.resolves(null),
      },
    };

    // mocks
    const classification = { intent: 'light.turnon', entities: [{ hey: 1 }] };
    const brain = {
      classify: () => Promise.resolve({ classification }),
    };
    const service = {
      getService: (serviceName) => {
        if (serviceName === 'telegram') {
          return telegramService;
        }
        if (serviceName === 'nextcloud-talk') {
          return nextCloudTalkService;
        }
        if (serviceName === 'callmebot') {
          return callmebotService;
        }
        if (serviceName === 'api-client') {
          return apiClientSource;
        }

        return null;
      },
    };

    const state = {
      get: () => {
        return {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          telegram_user_id: 'telegram-user-id',
        };
      },
    };

    variable = {
      getValue: () => {
        return 'next-cloud-talk-token';
      },
    };
    messageHandler = new MessageHandler(eventEmitter, brain, service, state, variable);
  });
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
    assert.calledWith(apiClientSource.message.send, 'XXXX');
  });
  it('should send reply to all source', async () => {
    await messageHandler.reply(
      {
        language: 'en',
        source: 'AI',
        source_user_id: 'XXXX',
        user: {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          language: 'en',
        },
      },
      'hey!',
      {},
    );
    assert.calledWith(telegramService.message.send, 'telegram-user-id');
    assert.calledWith(nextCloudTalkService.message.send, 'next-cloud-talk-token');
    assert.calledWith(callmebotService.message.send, '0cd30aef-9c4e-4a23-88e3-3547971296e5');
  });
  it('should fail to reply', async () => {
    variable.getValue = fake.rejects(new Error('cannot get'));
    await messageHandler.reply(
      {
        language: 'en',
        source: 'AI',
        source_user_id: 'XXXX',
        user: {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          language: 'en',
        },
      },
      'hey!',
      {},
    );
    assert.notCalled(nextCloudTalkService.message.send);
  });

  it('should persist tool_call but not forward externally for AI source', async () => {
    await messageHandler.reply(
      {
        language: 'en',
        source: 'AI',
        source_user_id: 'XXXX',
        user: {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          language: 'en',
        },
      },
      'device_get_state()',
      {},
      null,
      {
        messageType: 'tool_call',
        toolName: 'device_get_state',
        toolStatus: 'success',
      },
    );
    assert.notCalled(telegramService.message.send);
    assert.notCalled(nextCloudTalkService.message.send);
    assert.notCalled(callmebotService.message.send);
  });

  it('should persist tool_call but not forward externally for api-client source', async () => {
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
      'device_get_state()',
      {},
      null,
      {
        messageType: 'tool_call',
        toolName: 'device_get_state',
        toolStatus: 'success',
      },
    );
    assert.notCalled(apiClientSource.message.send);
  });

  it('should forward tool_call to telegram with compact status text', async () => {
    await messageHandler.reply(
      {
        language: 'en',
        source: 'telegram',
        source_user_id: 'telegram-chat-id',
        user: {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          language: 'en',
        },
      },
      'scene_create({"name":"test"})',
      {},
      null,
      {
        messageType: 'tool_call',
        toolName: 'scene_create',
        toolStatus: 'error',
      },
    );
    assert.calledOnce(telegramService.message.send);
    const [chatId, payload] = telegramService.message.send.firstCall.args;
    expect(chatId).to.equal('telegram-chat-id');
    expect(payload.text).to.equal('❌ scene_create');
    expect(payload.message_type).to.equal('tool_call');
    expect(payload.tool_name).to.equal('scene_create');
    expect(payload.tool_status).to.equal('error');
  });
});
