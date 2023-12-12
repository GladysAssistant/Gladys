const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const logger = {
  info: fake.returns(null),
};
const closeWebSocketClient = fake.returns(null);

const onWebSocketClose = proxyquire('../../../../../services/ewelink/lib/websocket/ewelink.onWebSocketClose', {
  '../../../../utils/logger': logger,
});
const EwelinkHandler = proxyquire('../../../../../services/ewelink/lib', {
  './websocket/ewelink.onWebSocketClose': onWebSocketClose,
  './websocket/ewelink.closeWebSocketClient': { closeWebSocketClient },
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

  it('should log info and close websocket', () => {
    eWeLinkHandler.onWebSocketClose();
    assert.calledOnceWithExactly(logger.info, 'eWeLink: WebSocket is closed');
    assert.calledOnceWithExactly(closeWebSocketClient);
  });
});
