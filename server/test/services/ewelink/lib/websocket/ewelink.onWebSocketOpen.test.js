const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const logger = {
  info: fake.returns(null),
};

const onWebSocketOpen = proxyquire('../../../../../services/ewelink/lib/websocket/ewelink.onWebSocketOpen', {
  '../../../../utils/logger': logger,
});
const EwelinkHandler = proxyquire('../../../../../services/ewelink/lib', {
  './websocket/ewelink.onWebSocketOpen': onWebSocketOpen,
});
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler onWebSocketOpen', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should log info', () => {
    eWeLinkHandler.onWebSocketOpen({ message: 'THIS IS AN ERROR' });
    assert.calledOnceWithExactly(logger.info, 'eWeLink: WebSocket is ready');
  });
});
