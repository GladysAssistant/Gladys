const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const { expect } = require('chai');
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');
const StateManager = require('../../../lib/state');
const { MESSAGE_GLADYS_ONLY_SERVICE, SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const buildServiceManager = (stateManager) => ({
  getService: (name) => stateManager.get('service', name),
});

describe('message.sendSystemMessage', () => {
  let stateManager;
  let telegramSendToUser;
  let signalSendToUser;

  const buildMessageHandler = (systemMessageService) => {
    const variable = { getValue: fake.resolves(systemMessageService) };
    return new MessageHandler(new EventEmitter(), {}, buildServiceManager(stateManager), stateManager, variable);
  };

  beforeEach(() => {
    stateManager = new StateManager();
    telegramSendToUser = fake.resolves(true);
    signalSendToUser = fake.resolves(true);
    stateManager.setState('service', 'telegram', { message: { sendToUser: telegramSendToUser } });
    stateManager.setState('service', 'ext-john-gladys-signal', { message: { sendToUser: signalSendToUser } });
    stateManager.setState('user', 'tony', { id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should send to every channel when no channel is set', async () => {
    const messageHandler = buildMessageHandler(null);
    const message = await messageHandler.sendSystemMessage('tony', 'Gladys was upgraded', null, {
      messageType: 'notification',
    });
    assert.calledOnceWithExactly(messageHandler.variable.getValue, SYSTEM_VARIABLE_NAMES.SYSTEM_MESSAGE_SERVICE);
    expect(message).to.have.property('text', 'Gladys was upgraded');
    expect(message).to.have.property('message_type', 'notification');
    assert.calledOnce(telegramSendToUser);
    assert.calledOnce(signalSendToUser);
  });

  it('should send to every channel when the setting was reset to an empty value', async () => {
    const messageHandler = buildMessageHandler('');
    await messageHandler.sendSystemMessage('tony', 'Backup failed');
    assert.calledOnce(telegramSendToUser);
    assert.calledOnce(signalSendToUser);
  });

  it('should send through the chosen channel only', async () => {
    const messageHandler = buildMessageHandler('ext-john-gladys-signal');
    const message = await messageHandler.sendSystemMessage('tony', 'Battery low');
    expect(message).to.have.property('message_type', 'chat');
    assert.notCalled(telegramSendToUser);
    assert.calledOnce(signalSendToUser);
  });

  it('should keep the message in the Gladys conversation only', async () => {
    const messageHandler = buildMessageHandler(MESSAGE_GLADYS_ONLY_SERVICE);
    const message = await messageHandler.sendSystemMessage('tony', 'Battery low');
    expect(message).to.have.property('id');
    assert.notCalled(telegramSendToUser);
    assert.notCalled(signalSendToUser);
  });
});
