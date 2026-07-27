const { assert, fake } = require('sinon');
const { expect } = require('chai');
const assertChai = require('chai').assert;
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');
const StateManager = require('../../../lib/state');

// the outbound channels are enumerated from the stateManager: every service
// exposing message.sendToUser is called, whatever its name
const buildServiceManager = (stateManager) => ({
  getService: (name) => stateManager.get('service', name),
});

describe('message.sendToUser', () => {
  it('should send message to user', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const messageHandler = new MessageHandler(event, {}, buildServiceManager(stateManager), stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
  });

  it('should persist notification message type', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const messageHandler = new MessageHandler(event, {}, buildServiceManager(stateManager), stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    const message = await messageHandler.sendToUser('test-user', 'digest', null, { messageType: 'notification' });
    expect(message).to.have.property('message_type', 'notification');
  });

  it('should forward the message to every service exposing message.sendToUser', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const telegramSendToUser = fake.resolves(true);
    const externalSendToUser = fake.resolves(true);
    stateManager.setState('service', 'telegram', { message: { sendToUser: telegramSendToUser } });
    stateManager.setState('service', 'ext-john-gladys-signal', { message: { sendToUser: externalSendToUser } });
    // services without the outbound interface are simply skipped
    stateManager.setState('service', 'philips-hue', { device: {} });
    stateManager.setState('service', 'broken', null);
    const messageHandler = new MessageHandler(event, {}, buildServiceManager(stateManager), stateManager);
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      telegram_user_id: 'one-id',
    };
    stateManager.setState('user', 'test-user', user);
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('text', 'coucou');
    assert.calledOnce(telegramSendToUser);
    assert.calledWith(telegramSendToUser, user);
    assert.calledOnce(externalSendToUser);
    expect(externalSendToUser.firstCall.args[1]).to.have.property('text', 'coucou');
  });

  it('should not fail when a channel fails, and still try the others', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const failingSendToUser = fake.rejects(new Error('CHANNEL_DOWN'));
    const workingSendToUser = fake.resolves(true);
    stateManager.setState('service', 'a-failing-channel', { message: { sendToUser: failingSendToUser } });
    stateManager.setState('service', 'z-working-channel', { message: { sendToUser: workingSendToUser } });
    const messageHandler = new MessageHandler(event, {}, buildServiceManager(stateManager), stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('text', 'coucou');
    assert.calledOnce(failingSendToUser);
    assert.calledOnce(workingSendToUser);
  });

  it('should throw error, user not found', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const messageHandler = new MessageHandler(event, {}, buildServiceManager(stateManager), stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    const promise = messageHandler.sendToUser('user-not-found', 'coucou');
    return assertChai.isRejected(promise);
  });
  it('should not fail when the last channel fails after the others succeeded', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const workingSendToUser = fake.resolves(true);
    const failingSendToUser = fake.rejects(new Error('Failed to send message: Apikey Correct'));
    stateManager.setState('service', 'a-working-channel', { message: { sendToUser: workingSendToUser } });
    stateManager.setState('service', 'z-failing-channel', { message: { sendToUser: failingSendToUser } });
    const messageHandler = new MessageHandler(event, {}, buildServiceManager(stateManager), stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
    assert.calledOnce(workingSendToUser);
    assert.calledOnce(failingSendToUser);
  });
});
