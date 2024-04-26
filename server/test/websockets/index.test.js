const EventEmitter = require('events');
const WebSocket = require('ws');
const { expect } = require('chai');
const { assert, fake, stub } = require('sinon');
const WebsocketManager = require('../../api/websockets');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

describe('Websockets', () => {
  it('should test connection with normal token', async () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
      user: {
        getById: fake.resolves({ firstname: 'toto' }),
      },
      session: {
        validateAccessToken: fake.returns({ user_id: '2efc9037-ff72-436b-9925-45782dfd305c' }),
      },
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    const promise = new Promise((resolve, reject) => {
      // @ts-ignore
      websocketManager.userConnected = (user, ws) => {
        try {
          expect(user).to.deep.equal({ firstname: 'toto' });
          resolve();
        } catch (e) {
          reject(e);
        }
      };
    });
    websocketManager.init();
    const ws = new EventEmitter();
    wss.emit('connection', ws);
    const connectionFirstMessage = {
      type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.REQUEST,
      payload: {
        accessToken: 'token',
      },
    };
    ws.emit('message', JSON.stringify(connectionFirstMessage));
    await promise;
    assert.calledWith(gladys.session.validateAccessToken, 'token');
  });
  it('should test connection with alarm token', async () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
      user: {
        getById: fake.resolves({ firstname: 'toto' }),
      },
      session: {
        validateAccessToken: stub()
          .onFirstCall()
          .throws('Invalid token')
          .onSecondCall()
          .returns({ user_id: '2efc9037-ff72-436b-9925-45782dfd305c' }),
      },
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    const promise = new Promise((resolve, reject) => {
      // @ts-ignore
      websocketManager.userConnected = (user, ws) => {
        try {
          expect(user).to.deep.equal({ firstname: 'toto' });
          resolve();
        } catch (e) {
          reject(e);
        }
      };
    });
    websocketManager.init();
    const ws = new EventEmitter();
    wss.emit('connection', ws);
    const connectionFirstMessage = {
      type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.REQUEST,
      payload: {
        accessToken: 'token',
      },
    };
    ws.emit('message', JSON.stringify(connectionFirstMessage));
    await promise;
  });
  it('should send message to all users', () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    const client = {
      readyState: WebSocket.OPEN,
      send: fake.returns(0),
    };
    const message = {
      type: 'test',
      payload: 'test',
    };
    websocketManager.userConnected({ id: 'aa0eaee9-5b90-4287-841a-0237f9d75832' }, client);
    websocketManager.sendMessageAllUsers(message);
    assert.calledWith(client.send, JSON.stringify(message));
  });
  it('should not send message to all users', () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    const client = {
      readyState: WebSocket.CLOSED,
      send: fake.returns(0),
    };
    const message = {
      type: 'test',
      payload: 'test',
    };
    websocketManager.userConnected({ id: 'aa0eaee9-5b90-4287-841a-0237f9d75832' }, client);
    websocketManager.sendMessageAllUsers(message);
    assert.notCalled(client.send);
  });
  it('should send message to one users', () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    const client = {
      readyState: WebSocket.OPEN,
      send: fake.returns(0),
    };
    const message = {
      type: 'test',
      payload: 'test',
    };
    websocketManager.userConnected({ id: 'aa0eaee9-5b90-4287-841a-0237f9d75832' }, client);
    websocketManager.sendMessageUser({ ...message, userId: 'aa0eaee9-5b90-4287-841a-0237f9d75832' });
    assert.calledWith(client.send, JSON.stringify(message));
  });
});
