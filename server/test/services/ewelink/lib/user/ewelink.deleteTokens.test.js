const sinon = require('sinon');

const { fake, assert } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('eWeLinkHandler deleteTokens', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        destroy: fake.resolves(null),
      },
      event: {
        emit: fake.returns(null),
      },
    };

    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
    eWeLinkHandler.ewelinkClient = {
      appId: 'APP_ID',
      at: 'ACCESS_TOKEN',
      rt: 'REFRESH_TOKEN',
      request: {
        delete: fake.resolves({}),
      },
    };
    eWeLinkHandler.status = { configured: true, connected: true };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should clear user tokens', async () => {
    await eWeLinkHandler.deleteTokens();

    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkClient.request.delete, '/v2/user/oauth/token', {
      headers: {
        'X-CK-Appid': 'APP_ID',
        Authorization: `Bearer ACCESS_TOKEN`,
      },
    });
    assert.calledOnceWithExactly(gladys.variable.destroy, 'USER_TOKENS', SERVICE_ID);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: false },
    });
  });
});
