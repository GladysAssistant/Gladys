const EventEmitter = require('events');
const { expect } = require('chai');
const { assert, fake } = require('sinon');

const WebsocketManager = require('../../api/websockets');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.send = fake.returns(null);
  ws.close = fake.returns(null);
  ws.terminate = fake.returns(null);
  return ws;
};

describe('Websockets external integrations', () => {
  it('should authenticate an integration with a valid JWT', async () => {
    const wss = new EventEmitter();
    const service = { id: 'service-id', selector: 'ext-demo' };
    const gladys = {
      event: new EventEmitter(),
      externalIntegration: {
        validateToken: fake.resolves(service),
        integrationConnected: fake.resolves(null),
        integrationDisconnected: fake.resolves(null),
      },
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    websocketManager.init();
    const ws = buildFakeWs();
    wss.emit('connection', ws);
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.INTEGRATION_REQUEST,
        payload: { token: 'integration-jwt' },
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    assert.calledWith(gladys.externalIntegration.validateToken, 'integration-jwt');
    assert.calledWith(gladys.externalIntegration.integrationConnected, service, ws);
    // the CONNECTED ack is sent back to the integration
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    expect(sentMessage.type).to.equal(WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.CONNECTED);
    assert.notCalled(ws.close);
  });

  it('should close the connection with an invalid integration JWT', async () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
      externalIntegration: {
        validateToken: fake.rejects(new Error('INTEGRATION_TOKEN_REVOKED')),
        integrationConnected: fake.resolves(null),
      },
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    websocketManager.init();
    const ws = buildFakeWs();
    wss.emit('connection', ws);
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.INTEGRATION_REQUEST,
        payload: { token: 'revoked-jwt' },
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    assert.calledWith(ws.close, 4000);
    assert.notCalled(gladys.externalIntegration.integrationConnected);
  });

  it('should route command results and heartbeats of an authenticated integration', async () => {
    const wss = new EventEmitter();
    const service = { id: 'service-id', selector: 'ext-demo' };
    const gladys = {
      event: new EventEmitter(),
      externalIntegration: {
        validateToken: fake.resolves(service),
        integrationConnected: fake.resolves(null),
        integrationDisconnected: fake.resolves(null),
        handleCommandResult: fake.returns(null),
        handleHeartbeat: fake.resolves(null),
      },
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    websocketManager.init();
    const ws = buildFakeWs();
    wss.emit('connection', ws);
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.INTEGRATION_REQUEST,
        payload: { token: 'integration-jwt' },
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.COMMAND_RESULT,
        payload: { message_id: 'uuid', success: true },
      }),
    );
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.HEARTBEAT,
        payload: {},
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    assert.calledWith(gladys.externalIntegration.handleCommandResult, service, { message_id: 'uuid', success: true });
    assert.calledWith(gladys.externalIntegration.handleHeartbeat, service);
    // close -> integrationDisconnected
    ws.emit('close');
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    assert.calledWith(gladys.externalIntegration.integrationDisconnected, service, ws);
  });

  it('should survive a failing disconnection handler', async () => {
    const wss = new EventEmitter();
    const service = { id: 'service-id', selector: 'ext-demo' };
    const gladys = {
      event: new EventEmitter(),
      externalIntegration: {
        validateToken: fake.resolves(service),
        integrationConnected: fake.resolves(null),
        integrationDisconnected: fake.rejects(new Error('CANNOT_DISCONNECT')),
      },
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    websocketManager.init();
    const ws = buildFakeWs();
    wss.emit('connection', ws);
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.INTEGRATION_REQUEST,
        payload: { token: 'integration-jwt' },
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    ws.emit('close');
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    assert.calledOnce(gladys.externalIntegration.integrationDisconnected);
  });

  it('should ignore command results before authentication', async () => {
    const wss = new EventEmitter();
    const gladys = {
      event: new EventEmitter(),
      externalIntegration: {
        handleCommandResult: fake.returns(null),
        handleHeartbeat: fake.resolves(null),
      },
    };
    const websocketManager = new WebsocketManager(wss, gladys);
    websocketManager.init();
    const ws = buildFakeWs();
    wss.emit('connection', ws);
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.COMMAND_RESULT,
        payload: { message_id: 'uuid', success: true },
      }),
    );
    ws.emit(
      'message',
      JSON.stringify({
        type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.HEARTBEAT,
        payload: {},
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    assert.notCalled(gladys.externalIntegration.handleCommandResult);
    assert.notCalled(gladys.externalIntegration.handleHeartbeat);
  });
});
