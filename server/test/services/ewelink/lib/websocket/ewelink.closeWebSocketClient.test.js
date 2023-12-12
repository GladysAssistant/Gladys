const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler closeWebSocketClient', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing', async () => {
    // Check client is not set first
    expect(eWeLinkHandler.ewelinkWebSocketClient).eq(null);
    eWeLinkHandler.closeWebSocketClient();
    expect(eWeLinkHandler.ewelinkWebSocketClient).eq(null);
  });

  it('should close websocket client', async () => {
    const wsClient = {
      close: fake.resolves(null),
    };
    eWeLinkHandler.ewelinkWebSocketClient = wsClient;

    eWeLinkHandler.closeWebSocketClient();

    assert.calledOnceWithExactly(wsClient.close);
    expect(eWeLinkHandler.ewelinkWebSocketClient).eq(null);
  });
});
