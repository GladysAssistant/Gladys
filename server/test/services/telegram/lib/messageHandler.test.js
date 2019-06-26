const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');

const MessageHandler = require('../../../../services/telegram/lib');
const TelegramApiMock = require('../TelegramApiMock.test');

const gladys = {
  user: {
    getByTelegramUserId: fake.resolves({
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

describe('Telegram.message', () => {
  const messageHandler = new MessageHandler(gladys, TelegramApiMock, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
  it('should connect', () => {
    messageHandler.connect('test');
  });
  it('should get custom link', async () => {
    const link = await messageHandler.getCustomLink('16ccd97d-14da-424f-bc5f-7d5a700fe2fb');
    const startWithTelegramLink = link.startsWith('https://telegram.me');
    expect(startWithTelegramLink).to.be.true; // eslint-disable-line
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
