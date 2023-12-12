const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake, stub, match } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('eWeLinkHandler loadConfiguration', () => {
  let eWeLinkHandler;
  let eWeLinkApiMock;
  let eWeLinkWsMock;
  let gladys;

  beforeEach(() => {
    eWeLinkWsMock = stub();
    eWeLinkWsMock.prototype.Connect = {
      create: stub(),
    };

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
      Ws: eWeLinkWsMock,
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
      assert.notCalled(eWeLinkApiMock.Ws);
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
      assert.notCalled(eWeLinkApiMock.Ws);
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
      assert.notCalled(eWeLinkApiMock.Ws);
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
      assert.calledOnceWithExactly(eWeLinkApiMock.Ws, {
        appId: 'APPLICATION_ID_VALUE',
        appSecret: 'APPLICATION_SECRET_VALUE',
        region: 'APPLICATION_REGION_VALUE',
      });

      assert.notCalled(eWeLinkWsMock.prototype.Connect.create);
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
    assert.calledOnceWithExactly(eWeLinkApiMock.Ws, {
      appId: 'APPLICATION_ID_VALUE',
      appSecret: 'APPLICATION_SECRET_VALUE',
      region: 'APPLICATION_REGION_VALUE',
    });

    assert.calledOnce(eWeLinkWsMock.prototype.Connect.create);
    assert.calledWithMatch(
      eWeLinkWsMock.prototype.Connect.create,
      match({ appId: 'APPLICATION_ID_VALUE', region: 'APPLICATION_REGION_VALUE', at: 'ACCESS_TOKEN' }),
      match.func,
      match.func,
      match.func,
      match.func,
    );

    expect(eWeLinkHandler.ewelinkWebAPIClient.at).eq('ACCESS_TOKEN');
    expect(eWeLinkHandler.ewelinkWebAPIClient.rt).eq('REFRESH_TOKEN');
  });
});
