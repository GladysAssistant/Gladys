const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const logger = {
  warn: fake.returns(null),
};
const createWebSocketClient = fake.returns(null);

const onWebSocketClose = proxyquire('../../../../../services/ewelink/lib/websocket/ewelink.onWebSocketClose', {
  '../../../../utils/logger': logger,
});
const EwelinkHandler = proxyquire('../../../../../services/ewelink/lib', {
  './websocket/ewelink.onWebSocketClose': onWebSocketClose,
  './websocket/ewelink.createWebSocketClient': { createWebSocketClient },
});
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler onWebSocketClose', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should only log warn', async () => {
    await eWeLinkHandler.onWebSocketClose();
    assert.calledOnceWithExactly(logger.warn, 'eWeLink: WebSocket is closed');
    assert.notCalled(createWebSocketClient);
  });

  it('should log warn and close websocket', async () => {
    eWeLinkHandler.ewelinkWebSocketClient = {};

    await eWeLinkHandler.onWebSocketClose();
    assert.calledOnceWithExactly(logger.warn, 'eWeLink: WebSocket is closed');
    assert.calledOnceWithExactly(createWebSocketClient);
  });
});
