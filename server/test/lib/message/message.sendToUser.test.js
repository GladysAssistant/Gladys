const { assert, fake, stub } = require('sinon');
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
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
  });
  it('should send message to and send telegram message', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const send = fake.resolves(true);
    const service = {
      getService: stub()
        .onFirstCall()
        .returns({
          message: {
            send,
          },
        })
        .onSecondCall()
        .returns(false),
    };
    const messageHandler = new MessageHandler(event, {}, service, stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      telegram_user_id: 'one-id',
    });
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
    assert.calledOnce(send);
  });
  it('should send message and send nextcloud talk message', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const send = fake.resolves(true);
    const service = {
      getService: stub()
        .onFirstCall()
        .returns(false)
        .onSecondCall()
        .returns({
          message: {
            send,
          },
        }),
    };
    const variable = {
      getValue: fake.resolves('a1z2e3'),
    };
    const messageHandler = new MessageHandler(event, {}, service, stateManager, variable);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      nextcloud_talk_token: 'a1z2e3',
    });
    const message = await messageHandler.sendToUser('test-user', 'coucou');
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
    const messageHandler = new MessageHandler(event, {}, service, stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      telegram_user_id: 'one-id',
    });
    const promise = messageHandler.sendToUser('user-not-found', 'coucou');
    return assertChai.isRejected(promise);
  });
});
