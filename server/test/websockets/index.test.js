const EventEmitter = require('events');
const WebSocket = require('ws');
const { assert, fake, spy } = require('sinon');
const WebsocketManager = require('../../api/websockets');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../utils/constants');

describe('Websockets', () => {
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
  it('should handle other, non auth websocket events', () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
    };

    const eventSpy = spy();
    gladys.event.on(EVENTS.WEBSOCKET.RECEIVE, eventSpy);

    const websocketManager = new WebsocketManager(wss, gladys);

    websocketManager.init();

    wss.emit(
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW,
      }),
    );

    assert.calledOnceWithExactly(eventSpy, {
      type: WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW,
    });
  });
});
