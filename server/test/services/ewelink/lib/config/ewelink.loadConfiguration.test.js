const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake, stub } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('eWeLinkHandler loadConfiguration', () => {
  let eWeLinkHandler;
  let eWeLinkApiMock;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
      variable: {
        getValue: stub().resolves(null),
      },
    };

    eWeLinkApiMock = {
      WebAPI: stub(),
    };
    eWeLinkHandler = new EwelinkHandler(gladys, eWeLinkApiMock, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw a ServiceNotConfiguredError as no variable is stored in database', async () => {
    try {
      await eWeLinkHandler.loadConfiguration();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).is.eq('eWeLink configuration is not setup');

      assert.callCount(gladys.event.emit, 2);
      assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
        payload: { configured: false, connected: false },
      });

      assert.callCount(gladys.variable.getValue, 3);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_ID', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_SECRET', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_REGION', SERVICE_ID);

      assert.notCalled(eWeLinkApiMock.WebAPI);
    }
  });

  it('should throw a ServiceNotConfiguredError as only APPLICATION_ID variable is stored in database', async () => {
    gladys.variable.getValue = sinon
      .stub()
      .onFirstCall()
      .resolves('APPLICATION_ID_VALUE')
      .resolves(null);

    try {
      await eWeLinkHandler.loadConfiguration();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).is.eq('eWeLink configuration is not setup');

      assert.callCount(gladys.event.emit, 2);
      assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
        payload: { configured: false, connected: false },
      });

      assert.callCount(gladys.variable.getValue, 3);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_ID', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_SECRET', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_REGION', SERVICE_ID);

      assert.notCalled(eWeLinkApiMock.WebAPI);
    }
  });

  it('should throw a ServiceNotConfiguredError as only APPLICATION_ID and APPLICATION_SECRET variable are stored in database', async () => {
    gladys.variable.getValue = sinon
      .stub()
      .onFirstCall()
      .resolves('APPLICATION_ID_VALUE')
      .onSecondCall()
      .resolves('APPLICATION_SECRET_VALUE')
      .resolves(null);

    try {
      await eWeLinkHandler.loadConfiguration();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).is.eq('eWeLink configuration is not setup');

      assert.callCount(gladys.event.emit, 2);
      assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
        payload: { configured: false, connected: false },
      });

      assert.callCount(gladys.variable.getValue, 3);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_ID', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_SECRET', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_REGION', SERVICE_ID);

      assert.notCalled(eWeLinkApiMock.WebAPI);
    }
  });

  it('should throw a ServiceNotConfiguredError as USER_TOKENS variable is missing in database', async () => {
    gladys.variable.getValue = sinon
      .stub()
      .onFirstCall()
      .resolves('APPLICATION_ID_VALUE')
      .onSecondCall()
      .resolves('APPLICATION_SECRET_VALUE')
      .onThirdCall()
      .resolves('APPLICATION_REGION_VALUE')
      .resolves(null);

    try {
      await eWeLinkHandler.loadConfiguration();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).is.eq('eWeLink user is not connected');

      assert.callCount(gladys.event.emit, 2);
      assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
        payload: { configured: false, connected: false },
      });
      assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
        payload: { configured: true, connected: false },
      });

      assert.callCount(gladys.variable.getValue, 4);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_ID', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_SECRET', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_REGION', SERVICE_ID);
      assert.calledWithExactly(gladys.variable.getValue, 'USER_TOKENS', SERVICE_ID);

      assert.calledOnceWithExactly(eWeLinkApiMock.WebAPI, {
        appId: 'APPLICATION_ID_VALUE',
        appSecret: 'APPLICATION_SECRET_VALUE',
        region: 'APPLICATION_REGION_VALUE',
      });
    }
  });

  it('should be well configured', async () => {
    gladys.variable.getValue = sinon
      .stub()
      .onFirstCall()
      .resolves('APPLICATION_ID_VALUE')
      .onSecondCall()
      .resolves('APPLICATION_SECRET_VALUE')
      .onThirdCall()
      .resolves('APPLICATION_REGION_VALUE')
      .resolves('{ "accessToken": "ACCESS_TOKEN", "refreshToken": "REFRESH_TOKEN" }');

    await eWeLinkHandler.loadConfiguration();

    assert.callCount(gladys.event.emit, 2);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: false, connected: false },
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: true },
    });

    assert.callCount(gladys.variable.getValue, 4);
    assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_ID', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_SECRET', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.getValue, 'APPLICATION_REGION', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.getValue, 'USER_TOKENS', SERVICE_ID);

    assert.calledOnceWithExactly(eWeLinkApiMock.WebAPI, {
      appId: 'APPLICATION_ID_VALUE',
      appSecret: 'APPLICATION_SECRET_VALUE',
      region: 'APPLICATION_REGION_VALUE',
    });

    expect(eWeLinkHandler.ewelinkClient.at).eq('ACCESS_TOKEN');
    expect(eWeLinkHandler.ewelinkClient.rt).eq('REFRESH_TOKEN');
  });
});
