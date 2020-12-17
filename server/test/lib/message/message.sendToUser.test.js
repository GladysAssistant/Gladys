const { assert, fake } = require('sinon');
const { expect } = require('chai');
const assertChai = require('chai').assert;
const EventEmitter = require('events');
const MessageHandler = require('../../../lib/message');
const StateManager = require('../../../lib/state');

describe('message.sendToUser', () => {
  it('should send message to user', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const service = {
      getService: () => null,
    };
    const messageHandler = new MessageHandler(event, {}, service, stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    const message = await messageHandler.sendToUser('test-user', 'test-service', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
  });
  it('should send message to and send telegram message', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    let send;
    const service = {
      getService: () => {
        send = fake.resolves(true);
        return {
          message: {
            send,
          },
        };
      },
    };
    const messageHandler = new MessageHandler(event, {}, service, stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      telegram_user_id: 'one-id',
    });
    const message = await messageHandler.sendToUser('test-user', 'telegram', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
    assert.calledOnce(send);
  });
  it('should throw error, user not found', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    let send;
    const service = {
      getService: () => {
        send = fake.resolves(true);
        return {
          message: {
            send,
          },
        };
      },
    };

    const serviceName = 'telegram';
    if (serviceName) {
      if (serviceSelector === 'telegram') {
        // We send the message to the telegram service
        stateManager.setState('user', 'test-user', {
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          telegram_user_id: 'one-id',
        });
        if (user.telegram_user_id) {
          const messageHandler = new MessageHandler(event, {}, service, stateManager);
          const promise = messageHandler.sendToUser('user-not-found', 'service-not-found', 'coucou');
          return assertChai.isRejected(promise);
        }
      } else if (serviceSelector === 'pushover') {
        // We send the message to the pushover service
        if ('user-not-found' && 'coucou') {
          const messageHandler = new MessageHandler(event, {}, service, stateManager);
          const promise = messageHandler.sendToUser('user-not-found', 'service-not-found', 'coucou');
          return assertChai.isRejected(promise);
        }
      }
    }
  });
});
