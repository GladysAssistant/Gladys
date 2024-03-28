const sinon = require('sinon');

const { fake, assert } = sinon;

const { expect } = require('chai');
const EwelinkHandler = require('../../../../services/ewelink/lib');
const { SERVICE_ID } = require('./constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

describe('eWeLinkHandler stop', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
    eWeLinkHandler.ewelinkWebAPIClient = {};
    eWeLinkHandler.status = { configured: true, connected: true };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should emit event', async () => {
    await eWeLinkHandler.stop();
    expect(eWeLinkHandler.ewelinkWebAPIClient).to.eq(null);

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: false },
    });
  });
});
