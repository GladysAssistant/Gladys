const { assert, fake } = require('sinon');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');

describe('message.reply', () => {
  const eventEmitter = new EventEmitter();
  let messageHandler;
  let telegramService;
  let nextCloudTalkService;
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
        if (serviceName === 'api-client') {
          return apiClientSource;
        }

        return null;
      },
    };

    const state = {
      get: () => {
        return {
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
});
