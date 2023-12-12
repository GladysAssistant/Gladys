const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert, match } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID, EWELINK_APP_ID, EWELINK_APP_REGION } = require('../constants');
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
    eWeLinkHandler.ewelinkWebAPIClient = {
      oauth: {
        getToken: fake.resolves({ data: tokens }),
      },
    };
    eWeLinkHandler.ewelinkWebSocketClientFactory = {
      Connect: {
        create: fake.returns({}),
      },
    };
    eWeLinkHandler.status = {
      configured: true,
      connected: false,
    };
    eWeLinkHandler.loginState = 'LOGIN_STATE';
    eWeLinkHandler.configuration = {
      applicationId: EWELINK_APP_ID,
      applicationRegion: EWELINK_APP_REGION,
    };
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

    assert.notCalled(eWeLinkHandler.ewelinkWebAPIClient.oauth.getToken);
    assert.notCalled(eWeLinkHandler.ewelinkWebSocketClientFactory.Connect.create);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.event.emit);
  });

  it('should retreive, store user token and emit event', async () => {
    const redirectUrl = 'http://localhost:1440';
    const code = 'auth_code';
    const region = 'app_region';
    const state = 'LOGIN_STATE';

    await eWeLinkHandler.exchangeToken({ redirectUrl, code, region, state });

    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkWebAPIClient.oauth.getToken, {
      code,
      redirectUrl,
      region,
    });
    assert.calledOnce(eWeLinkHandler.ewelinkWebSocketClientFactory.Connect.create);
    assert.calledWithMatch(
      eWeLinkHandler.ewelinkWebSocketClientFactory.Connect.create,
      match({ appId: EWELINK_APP_ID, region: EWELINK_APP_REGION, at: tokens.accessToken }),
      match.func,
      match.func,
      match.func,
      match.func,
    );
    assert.calledOnceWithExactly(gladys.variable.setValue, 'USER_TOKENS', JSON.stringify(tokens), SERVICE_ID);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: true },
    });
  });
});
