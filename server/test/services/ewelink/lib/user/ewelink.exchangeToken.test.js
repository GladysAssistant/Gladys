const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const { BadParameters } = require('../../../../../utils/coreErrors');

const tokens = { accessToken: 'ACCESS_TOKEN', refreshToken: 'REFRESH_TOKEN' };

describe('eWeLinkHandler exchangeToken', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        setValue: fake.resolves(null),
      },
      event: {
        emit: fake.returns(null),
      },
    };

    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
    eWeLinkHandler.ewelinkClient = {
      oauth: {
        getToken: fake.resolves({ data: tokens }),
      },
    };
    eWeLinkHandler.status = {
      configured: true,
      connected: false,
    };
    eWeLinkHandler.loginState = 'LOGIN_STATE';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error as loginState does not match', async () => {
    const redirectUrl = 'http://localhost:1440';
    const code = 'auth_code';
    const region = 'app_region';
    const state = 'invalid_state';

    try {
      await eWeLinkHandler.exchangeToken({ redirectUrl, code, region, state });
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
      expect(e.message).eq('eWeLink login state is invalid');
    }

    assert.notCalled(eWeLinkHandler.ewelinkClient.oauth.getToken);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.event.emit);
  });

  it('should retreive, store user token and emit event', async () => {
    const redirectUrl = 'http://localhost:1440';
    const code = 'auth_code';
    const region = 'app_region';
    const state = 'LOGIN_STATE';

    await eWeLinkHandler.exchangeToken({ redirectUrl, code, region, state });

    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkClient.oauth.getToken, {
      code,
      redirectUrl,
      region,
    });
    assert.calledOnceWithExactly(gladys.variable.setValue, 'USER_TOKENS', JSON.stringify(tokens), SERVICE_ID);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: true },
    });
  });
});
