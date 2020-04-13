const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;
const WebSocketServerMock = require('./WebSocketServerMock.test');
const WebsocketManager = require('../../api/websockets');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

const wss = new WebSocketServerMock();
const userId = 'USER_ID';
const user = { id: userId, firstname: 'Tony' };

const gladys = {
  event: {
    on: fake.returns(null),
  },
  session: {
    validateAccessToken: fake.returns(user),
  },
  user: {
    getById: fake.returns({ id: userId }),
  },
};

describe('websocket lib', () => {
  let websocketManager;

  beforeEach(() => {
    sinon.reset();
    websocketManager = new WebsocketManager(wss, gladys);
    websocketManager.init();
  });

  afterEach(() => {
    wss.ws.removeAllListeners();
  });

  it('message type not handled', () => {
    const message = {};
    wss.ws.emit('message', JSON.stringify(message));

    assert.notCalled(wss.ws.close);
    assert.notCalled(gladys.session.validateAccessToken);
    assert.notCalled(gladys.user.getById);
  });

  it('handle empty authentication request', () => {
    const message = {
      type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.REQUEST,
    };
    wss.ws.emit('message', JSON.stringify(message));

    assert.called(wss.ws.close);
    assert.notCalled(gladys.session.validateAccessToken);
    assert.notCalled(gladys.user.getById);
  });

  it('handle authentication request', () => {
    const message = {
      type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.REQUEST,
      payload: {
        accessToken: 'accessToken',
      },
    };
    wss.ws.emit('message', JSON.stringify(message));

    assert.notCalled(wss.ws.close);
    assert.called(gladys.session.validateAccessToken);
    assert.called(gladys.user.getById);
  });

  it('userConnected: add new connection', () => {
    const client = 'CLIENT';

    // First add
    websocketManager.userConnected(user, client);

    expect(websocketManager.connections).to.deep.eq({
      [userId]: [
        {
          user,
          client,
          subscriptions: {},
        },
      ],
    });

    // Second add (same)
    websocketManager.userConnected(user, client);

    expect(websocketManager.connections).to.deep.eq({
      [userId]: [
        {
          user,
          client,
          subscriptions: {},
        },
      ],
    });

    // Third add (a new one)
    const client2 = 'CLIENT2';
    websocketManager.userConnected(user, client2);

    expect(websocketManager.connections).to.deep.eq({
      [userId]: [
        {
          user,
          client,
          subscriptions: {},
        },
        {
          user,
          client: client2,
          subscriptions: {},
        },
      ],
    });
  });

  it('userDisconnected: remove connection', () => {
    const client = 'CLIENT';
    websocketManager.userConnected(user, client);
    const client2 = 'CLIENT2';
    websocketManager.userConnected(user, client2);

    websocketManager.userDisconnected(user, client2);

    expect(websocketManager.connections).to.deep.eq({
      [userId]: [
        {
          user,
          client,
          subscriptions: {},
        },
      ],
    });
  });

  it('userDisconnected: remove not existing connection', () => {
    const client2 = 'CLIENT2';
    websocketManager.userDisconnected(user, client2);

    expect(websocketManager.connections).to.deep.eq({
      [userId]: [],
    });
  });

  it('addSubscriber: add subscription', () => {
    const client = 'CLIENT';
    websocketManager.userConnected(user, client);

    const event = 'event';
    websocketManager.addSubscriber(event, client);
    websocketManager.addSubscriber(event, client);

    expect(websocketManager.connections).to.deep.eq({
      [userId]: [
        {
          user,
          client,
          subscriptions: { event: 2 },
        },
      ],
    });
  });

  it('addSubscriber: add subscription to missing client', () => {
    const client = 'CLIENT';
    const event = 'event';
    websocketManager.addSubscriber(event, client);

    expect(websocketManager.connections).to.deep.eq({});
  });

  it('removeSubscriber: remove subscription', () => {
    const client = 'CLIENT';
    websocketManager.userConnected(user, client);

    const event = 'event';
    websocketManager.addSubscriber(event, client);
    websocketManager.removeSubscriber(event, client);

    expect(websocketManager.connections).to.deep.eq({
      [userId]: [
        {
          user,
          client,
          subscriptions: { event: 0 },
        },
      ],
    });
  });

  it('removeSubscriber: remove subscription to missing client', () => {
    const client = 'CLIENT';
    const event = 'event';
    websocketManager.removeSubscriber(event, client);

    expect(websocketManager.connections).to.deep.eq({});
  });

  it('sendMessageUser: to unknown user', () => {
    const message = { type: 'type', payload: 'payload', userId };
    websocketManager.sendMessageUser(message);

    assert.notCalled(wss.ws.send);
  });

  it('sendMessageUser: to known user, but no subscription', () => {
    const client = 'CLIENT';
    websocketManager.userConnected(user, client);

    const message = { type: 'type', payload: 'payload', userId };
    websocketManager.sendMessageUser(message);

    assert.notCalled(wss.ws.send);
  });

  it('sendMessageUser: success', () => {
    const type = 'event';
    websocketManager.userConnected(user, wss.ws);

    const message = { type, payload: 'payload', userId };
    websocketManager.addSubscriber(type, wss.ws);

    websocketManager.sendMessageUser(message);

    assert.called(wss.ws.send);
  });

  it('sendMessageAllUsers: to unknown user', () => {
    const message = { type: 'type', payload: 'payload' };
    websocketManager.sendMessageUser(message);

    assert.notCalled(wss.ws.send);
  });

  it('sendMessageAllUsers: to known user, but no subscription', () => {
    const client = 'CLIENT';
    websocketManager.userConnected(user, client);

    const message = { type: 'type', payload: 'payload' };
    websocketManager.sendMessageAllUsers(message);

    assert.notCalled(wss.ws.send);
  });

  it('sendMessageAllUsers: success', () => {
    const type = 'event';
    websocketManager.userConnected(user, wss.ws);

    const message = { type, payload: 'payload' };
    websocketManager.addSubscriber(type, wss.ws);

    websocketManager.sendMessageAllUsers(message);

    assert.called(wss.ws.send);
  });
});
