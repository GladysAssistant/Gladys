const { expect } = require('chai');
const sinon = require('sinon');

const { stub, assert } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');
const { ServiceNotConfiguredError, BadParameters } = require('../../../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const tokens = { accessToken: 'ACCESS_TOKEN', refreshToken: 'REFRESH_TOKEN' };

describe('eWeLinkHandler handleRequest', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        setValue: stub().resolves(true),
        destroy: stub().resolves(true),
      },
      event: {
        emit: stub().returns(null),
      },
    };

    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
    eWeLinkHandler.status = { configured: true, connected: true };
    eWeLinkHandler.ewelinkWebAPIClient = {
      user: {
        refreshToken: stub().resolves({ error: 0, data: tokens }),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throws ServiceNotConfiguredError when service is not completly configured (not configured)', async () => {
    eWeLinkHandler.status = { configured: false, connected: true };
    const request = stub().resolves({ data: 'SUCCESS' });

    try {
      await eWeLinkHandler.handleRequest(request);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('eWeLink is not ready, please complete the configuration');
    }

    assert.notCalled(request);
    assert.notCalled(eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);
    assert.notCalled(gladys.event.emit);
  });

  it('should throws ServiceNotConfiguredError when service is not completly configured (not connected)', async () => {
    eWeLinkHandler.status = { configured: true, connected: false };
    const request = stub().resolves({ data: 'SUCCESS' });

    try {
      await eWeLinkHandler.handleRequest(request);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('eWeLink is not ready, please complete the configuration');
    }

    assert.notCalled(request);
    assert.notCalled(eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);
    assert.notCalled(gladys.event.emit);
  });

  it('should returns response data at first call', async () => {
    const request = stub().resolves({ data: 'SUCCESS' });

    const result = await eWeLinkHandler.handleRequest(request);
    expect(result).eq('SUCCESS');

    assert.calledOnceWithExactly(request);
    assert.notCalled(eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);
    assert.notCalled(gladys.event.emit);
  });

  it('should retry once before returning response data', async () => {
    const request = stub()
      .onFirstCall()
      .resolves({ data: 'RETRY', error: 402 })
      .resolves({ data: 'SUCCESS' });

    const result = await eWeLinkHandler.handleRequest(request);
    expect(result).eq('SUCCESS');

    assert.calledTwice(request);
    assert.alwaysCalledWithExactly(request);
    assert.calledOnce(eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken);
    assert.calledOnceWithExactly(gladys.variable.setValue, 'USER_TOKENS', JSON.stringify(tokens), SERVICE_ID);
    assert.notCalled(gladys.variable.destroy);
    assert.notCalled(gladys.event.emit);
  });

  it('should retry only once even if all calls return 402 error', async () => {
    const request = stub().resolves({ data: 'RETRY', error: 402, msg: 'ERROR FROM API' });

    try {
      await eWeLinkHandler.handleRequest(request);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('ERROR FROM API');
    }

    assert.calledTwice(request);
    assert.alwaysCalledWithExactly(request);
    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken);
    assert.calledOnceWithExactly(gladys.variable.setValue, 'USER_TOKENS', JSON.stringify(tokens), SERVICE_ID);
    assert.calledOnceWithExactly(gladys.variable.destroy, 'USER_TOKENS', SERVICE_ID);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: false },
    });
  });

  it('should not retry if refresh token returns 402 error', async () => {
    eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken = stub().resolves({ error: 402, msg: 'ERROR FROM API' });

    const request = stub().resolves({ data: 'RETRY', error: 402 });

    try {
      await eWeLinkHandler.handleRequest(request);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('ERROR FROM API');
    }

    assert.calledOnceWithExactly(request);
    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken);
    assert.notCalled(gladys.variable.setValue);
    assert.calledOnceWithExactly(gladys.variable.destroy, 'USER_TOKENS', SERVICE_ID);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: false },
    });
  });

  it('should throws BadParameters error on 400 error', async () => {
    const request = stub().resolves({ data: 'ERROR', error: 400, msg: 'API ERROR' });

    try {
      await eWeLinkHandler.handleRequest(request);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
      expect(e.message).to.equal('API ERROR');
    }

    assert.calledOnceWithExactly(request);
    assert.notCalled(eWeLinkHandler.ewelinkWebAPIClient.user.refreshToken);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);
    assert.notCalled(gladys.event.emit);
  });
});
