const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler closeWebSocketClient', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
    eWeLinkHandler.ewelinkWebSocketClient = {
      Connect: {},
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing', async () => {
    // Check client is not set first
    expect(eWeLinkHandler.ewelinkWebSocketClient.ws).eq(undefined);
    eWeLinkHandler.closeWebSocketClient();
    expect(eWeLinkHandler.ewelinkWebSocketClient.ws).eq(undefined);
  });

  it('should close websocket client', async () => {
    eWeLinkHandler.ewelinkWebSocketClient.Connect.ws = {
      close: fake.resolves(null),
    };

    eWeLinkHandler.closeWebSocketClient();

    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkWebSocketClient.Connect.ws.close);
  });
});
