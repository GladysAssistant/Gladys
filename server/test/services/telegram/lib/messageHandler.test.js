const { expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');

const MessageHandler = require('../../../../services/telegram/lib');
const TelegramApiMock = require('../TelegramApiMock.test');

const User = require('../../../../lib/user');
const Session = require('../../../../lib/session');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

const stateManager = new StateManager(event);

describe('Telegram.message', () => {
  const session = new Session('secret');
  const user = new User(session, stateManager);
  const gladys = {
    user,
    cache: {
      set: fake.returns(null),
      get: fake.returns('0cd30aef-9c4e-4a23-88e3-3547971296e5'),
    },
    event,
  };
  const messageHandler = new MessageHandler(gladys, TelegramApiMock, '55f177d7-bc35-4560-a1f0-4c58b9e9f2c4');
  it('should connect', async () => {
    await messageHandler.connect('test');
  });
  it('should get custom link', async () => {
    const link = await messageHandler.getCustomLink('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    const startWithTelegramLink = link.startsWith('https://telegram.me');
    expect(startWithTelegramLink).to.equal(true);
  });
  it('should handle new start message and link user', async () => {
    const link = await messageHandler.getCustomLink('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    const [, apiKey] = link.split('?start=');
    await messageHandler.newMessage({
      from: {
        id: 6072774859,
      },
      chat: {
        id: 6072774859,
      },
      text: `/start ${apiKey}`,
      date: new Date(),
    });
    const newUser = await user.getByTelegramUserId('6072774859');
    expect(newUser).to.have.property('id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
  });
  it('should handle new message', async () => {
    await messageHandler.linkUser('apiKey', '6072774859');
    await messageHandler.newMessage({
      from: {
        id: 6072774859,
      },
      chat: {
        id: 6072774859,
      },
      text: 'Hey',
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
