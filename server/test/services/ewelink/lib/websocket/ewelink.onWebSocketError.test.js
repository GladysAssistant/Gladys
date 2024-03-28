const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const logger = {
  error: fake.returns(null),
};

const onWebSocketError = proxyquire('../../../../../services/ewelink/lib/websocket/ewelink.onWebSocketError', {
  '../../../../utils/logger': logger,
});
const EwelinkHandler = proxyquire('../../../../../services/ewelink/lib', {
  './websocket/ewelink.onWebSocketError': onWebSocketError,
});
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler onWebSocketError', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should log error', () => {
    eWeLinkHandler.onWebSocketError({ message: 'THIS IS AN ERROR' });
    assert.calledOnceWithExactly(logger.error, 'eWeLink: WebSocket is on error: %s', 'THIS IS AN ERROR');
  });
});
