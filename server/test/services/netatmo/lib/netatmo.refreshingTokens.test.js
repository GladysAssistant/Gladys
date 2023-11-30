const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');
const assertJS = require('assert');

const { assert, fake } = sinon;

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext,
});
const { STATUS } = require('../../../../services/netatmo/lib/utils/netatmo.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
// const netatmoHandler = new NetatmoHandler(gladys, serviceId);

const configuration = {
  clientId: 'clientId',
  clientSecret: 'clientSecret',
};
const refreshToken = 'refreshToken';

describe('NetatmoHandler.refreshingTokens', () => {
  let netatmoHandler
  beforeEach(() => {
    sinon.reset();
    netatmoHandler = new NetatmoHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should throw an error if clientId is missing', async () => {
    const badConfiguration = { ...configuration, clientId: null };
    try {
      await netatmoHandler.refreshingTokens(
        badConfiguration,
        refreshToken,
      );
      // assert.fail();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(netatmoHandler.status).to.eq(STATUS.NOT_INITIALIZED);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.NOT_INITIALIZED },
    });
  });
  it('should throw an error if clientSecret is missing', async () => {
    const badConfiguration = { ...configuration, clientSecret: null };
    try {
      await netatmoHandler.refreshingTokens(
        badConfiguration,
        refreshToken,
      );
      assert.fail();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(netatmoHandler.status).to.eq(STATUS.NOT_INITIALIZED);
    }

    expect(netatmoHandler.status).to.eq(STATUS.NOT_INITIALIZED);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.NOT_INITIALIZED },
    });
  });
  it('should throw an error if refreshToken is missing', async () => {
    const badRefreshToken = null;
    try {
      await netatmoHandler.refreshingTokens(
        configuration,
        badRefreshToken,
      );
      assert.fail();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(netatmoHandler.status).to.eq(STATUS.NOT_INITIALIZED);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.NOT_INITIALIZED },
    });
  });
  it('should refresh tokens successfully', async () => {
    netatmoHandler.stateGetAccessToken = 'state'
    const setTokensSpy = sinon.spy(netatmoHandler, 'setTokens');
    nock(`${netatmoHandler.baseUrl}`)
      .persist()
      .post('/oauth2/token')
      .reply(200, {
        access_token: 'fake_access_token',
        refresh_token: 'fake_refresh_token',
        expire_in: 10800,
      });

    const response = await netatmoHandler.refreshingTokens(
      configuration,
      refreshToken,
    );
    // Checking the results
    expect(response).to.deep.equal({ success: true });
    expect(netatmoHandler.status).to.equal(STATUS.CONNECTED);
    expect(netatmoHandler.configured).to.eq(true);
    // Checking that setTokens was called with the correct tokens
    expect(setTokensSpy.calledOnce).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('access_token', 'fake_access_token'))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('refresh_token', 'fake_refresh_token'))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('expire_in', 10800))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('connected', true))).to.be.true;
    // Checking the events emits
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.PROCESSING_TOKEN },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.CONNECTED },
    });
    // Cleaning
    setTokensSpy.resetHistory();
    nock.isDone();
  });
  it('should handle axios query errors in refreshTokens', async () => {
    nock(`${netatmoHandler.baseUrl}`)
      .persist()
      .post('/oauth2/token')
      .reply(500, { error: 'Server Error' });
    await assertJS.rejects(
      async () => {
        await netatmoHandler.refreshingTokens(configuration, refreshToken);
      },
      (err) => {
        assertJS(err instanceof ServiceNotConfiguredError);
        assertJS(netatmoHandler.status === STATUS.DISCONNECTED);
        assertJS(err.message.includes('500'));
        assert.callCount(gladys.event.emit, 3);
        assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
          payload: { status: STATUS.PROCESSING_TOKEN },
        });
        assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
          payload: { statusType: STATUS.PROCESSING_TOKEN, status: 'refresh_token_fail' },
        });
        assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
          payload: { status: STATUS.DISCONNECTED },
        });
        return true;
      }
    );
    // Cleaning
    nock.isDone();
  });
  it('should handle errors from setTokens function in refreshTokens', async () => {
    sinon.stub(netatmoHandler, 'setTokens').rejects(new Error('Set tokens error'));
    nock(`${netatmoHandler.baseUrl}`)
      .persist()
      .post('/oauth2/token')
      .reply(200, {
        access_token: 'fake_access_token',
        refresh_token: 'fake_refresh_token',
        expire_in: 10800,
      });
    netatmoHandler.stateGetAccessToken = 'state'
    await assertJS.rejects(
      async () => {
        await netatmoHandler.refreshingTokens(configuration, refreshToken);
      },
      (err) => {
        assertJS(err instanceof ServiceNotConfiguredError);
        assertJS(err.message.includes('Set tokens error'));
        assertJS(!err.message.includes('200'));
        assertJS(netatmoHandler.status === STATUS.DISCONNECTED);
        return true;
      }
    );
    assert.callCount(gladys.event.emit, 3); 
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.PROCESSING_TOKEN },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
      payload: { statusType: STATUS.PROCESSING_TOKEN, status: 'refresh_token_fail' },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.DISCONNECTED },
    });
    // Cleaning
    nock.isDone();
    netatmoHandler.setTokens.reset();
  });
});