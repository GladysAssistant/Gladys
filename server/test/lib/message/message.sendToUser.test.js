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
  it('should persist notification message type', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const service = {
      getService: () => null,
    };
    const messageHandler = new MessageHandler(event, {}, service, stateManager);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
    const message = await messageHandler.sendToUser('test-user', 'digest', null, { messageType: 'notification' });
    expect(message).to.have.property('message_type', 'notification');
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
  it('should send message and send callmebot message', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const send = fake.resolves(true);
    const service = {
      getService: stub()
        .onFirstCall()
        .returns(null)
        .onSecondCall()
        .returns(null)
        .onThirdCall()
        .returns({
          message: {
            send,
          },
        }),
    };
    const variable = {};
    const messageHandler = new MessageHandler(event, {}, service, stateManager, variable);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
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
  it('should continue sending to other services when one service fails', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const telegramSend = fake.rejects(new Error('telegram down'));
    const nextcloudSend = fake.resolves(true);
    const callmebotSend = fake.resolves(true);
    const service = {
      getService: stub()
        .onFirstCall()
        .returns({
          message: {
            send: telegramSend,
          },
        })
        .onSecondCall()
        .returns({
          message: {
            send: nextcloudSend,
            serviceId: 'nextcloud-service-id',
          },
        })
        .onThirdCall()
        .returns({
          message: {
            send: callmebotSend,
          },
        }),
    };
    const variable = {
      getValue: fake.resolves('a1z2e3'),
    };
    const messageHandler = new MessageHandler(event, {}, service, stateManager, variable);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      telegram_user_id: 'one-id',
    });
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
    assert.calledOnce(telegramSend);
    assert.calledOnce(nextcloudSend);
    assert.calledOnce(callmebotSend);
  });
  it('should continue sending when callmebot fails after other services succeed', async () => {
    const event = new EventEmitter();
    const stateManager = new StateManager();
    const telegramSend = fake.resolves(true);
    const nextcloudSend = fake.resolves(true);
    const callmebotSend = fake.rejects(new Error('Failed to send message: Apikey Correct'));
    const service = {
      getService: stub()
        .onFirstCall()
        .returns({
          message: {
            send: telegramSend,
          },
        })
        .onSecondCall()
        .returns({
          message: {
            send: nextcloudSend,
            serviceId: 'nextcloud-service-id',
          },
        })
        .onThirdCall()
        .returns({
          message: {
            send: callmebotSend,
          },
        }),
    };
    const variable = {
      getValue: fake.resolves('a1z2e3'),
    };
    const messageHandler = new MessageHandler(event, {}, service, stateManager, variable);
    stateManager.setState('user', 'test-user', {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      telegram_user_id: 'one-id',
    });
    const message = await messageHandler.sendToUser('test-user', 'coucou');
    expect(message).to.have.property('id');
    expect(message).to.have.property('text', 'coucou');
    assert.calledOnce(telegramSend);
    assert.calledOnce(nextcloudSend);
    assert.calledOnce(callmebotSend);
  });
});
