const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');

const { ServiceNotConfiguredError, NotFoundError } = require('../../../../utils/coreErrors');

const MessageHandler = require('../../../../services/slack/lib');
const SlackApiMock = require('../SlackApiMock.test');

const gladys = {
  user: {
    getBySlackUserId: fake.resolves({
      id: '7439f28c-2993-4369-b4e9-59ca0cf2af5e',
      language: 'en',
    }),
    update: fake.resolves(null),
  },
  cache: {
    set: fake.returns(null),
    get: fake.returns('7439f28c-2993-4369-b4e9-59ca0cf2af5e'),
  },
  event: new EventEmitter(),
};

describe('Slack.message', () => {
  const messageHandler = new MessageHandler(gladys, SlackApiMock, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
  it('should not get custom link', async () => {
    expect(messageHandler.getCustomLink('16ccd97d-14da-424f-bc5f-7d5a700fe2fb')).to.be.rejectedWith(
      ServiceNotConfiguredError,
    );
  });

  it('should not handle new start message', async () => {
    gladys.cache.get = fake.returns(null);
    expect(
      messageHandler.newMessage({
        from: {
          id: '89798374Z7',
        },
        text: '/start testapikey',
        date: new Date(),
      }),
    ).to.be.rejectedWith(NotFoundError);
    gladys.cache.get = fake.returns('7439f28c-2993-4369-b4e9-59ca0cf2af5e');
  });

  it('should connect', () => {
    messageHandler.connect('test');
  });
  it('should get custom link', async () => {
    const link = await messageHandler.getCustomLink('16ccd97d-14da-424f-bc5f-7d5a700fe2fb');
    const slackLinkNotEmpty = link.length > 0;
    expect(slackLinkNotEmpty).to.be.true; // eslint-disable-line
  });
  it('should handle new message', async () => {
    await messageHandler.newMessage({
      from: {
        id: '89798374Z7',
      },
      text: 'Hey',
      date: new Date(),
    });
  });
  it('should handle new start message', async () => {
    await messageHandler.newMessage({
      from: {
        id: '89798374Z7',
      },
      text: '/start testapikey',
      date: new Date(),
    });
  });
  it('should send message', async () => {
    await messageHandler.send('chatId', {
      text: 'Hey',
    });
  });
  it('should send message with image', async () => {
    await messageHandler.send('chatId', {
      text: 'Hey',
      file: 'abase64fiulessdfdksjfksdljflskjfklsjflksjfldksjlkjfkjklj',
    });
  });
});
