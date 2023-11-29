const { expect } = require('chai');
const sinon = require('sinon');
const crypto = require('crypto');
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
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

const configuration = {
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  scopes: { scopeEnergy: 'read_thermostat write_thermostat' }
};
const body = {
  codeOAuth: 'codeOAuth',
  state: 'state',
  redirectUri: 'redirectUri'
};

describe.only('NetatmoHandler.connect', () => {

  beforeEach(() => {
    sinon.reset();
    netatmoHandler.status = 'UNKNOWN';
    // @ts-ignore
    this.randomBytesStub = sinon.stub(crypto, 'randomBytes').returns(Buffer.from('1234567890abcdef1234567890abcdef', 'hex'));
  });
  afterEach(() => {
    sinon.reset();
    this.randomBytesStub.restore();
  });

  it('should throw an error if clientId is missing', async () => {
    const badConfiguration = { ...configuration, clientId: null };
    try {
      await netatmoHandler.connect(netatmoHandler, badConfiguration);
      assert.fail();
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
      await netatmoHandler.connect(netatmoHandler, badConfiguration);
      assert.fail();
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
  it('should throw an error if scopes is missing', async () => {
    const badConfiguration = { ...configuration, scopes: undefined };
    try {
      await netatmoHandler.connect(netatmoHandler, badConfiguration);
      assert.fail();
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
  it('should return redirectUri to connect successfully', async () => {
    const baseUrl = 'https://api.netatmo.net';
    const response = await netatmoHandler.connect(netatmoHandler, configuration);

    const expectedState = '1234567890abcdef1234567890abcdef';
    expect(netatmoHandler.status).to.eq(STATUS.CONNECTING);
    expect(netatmoHandler.configured).to.eq(true);
    expect(response).to.deep.equal({
      authUrl: `${baseUrl}/oauth2/authorize?client_id=clientId&scope=read_thermostat%20write_thermostat&state=${expectedState}`,
      state: expectedState
    });

    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
  });
});

describe.only('NetatmoHandler.retrieveTokens', () => {
  beforeEach(() => {
    sinon.reset();
    netatmoHandler.status = 'UNKNOWN';
  });

  afterEach(() => {
    sinon.reset();
    nock.isDone();
  });

  it('should throw an error if clientId is missing', async () => {
    const badConfiguration = { ...configuration, clientId: null };
    try {
      await netatmoHandler.retrieveTokens(
        netatmoHandler,
        badConfiguration,
        body,
      );
      assert.fail();
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
      await netatmoHandler.retrieveTokens(
        netatmoHandler,
        badConfiguration,
        body,
      );
      expect.fail('should have thrown an error');
      assert.fail();
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
  it('should throw an error if scopes is missing', async () => {
    const badConfiguration = { ...configuration, scopes: undefined };
    try {
      await netatmoHandler.retrieveTokens(
        netatmoHandler,
        badConfiguration,
        body,
      );
      assert.fail();
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
  it('should throw an error if codeOAuth is missing', async () => {
    const badBody = { ...body, codeOAuth: null };
    try {
      await netatmoHandler.retrieveTokens(
        netatmoHandler,
        configuration,
        badBody,
      );
      assert.fail();
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
  it('should throw an error if state !== netatmoHandler.stateGetAccessToken', async () => {
    const badBody = { ...body, state: 'bad_state' };
    netatmoHandler.stateGetAccessToken = 'state'
    try {

      await netatmoHandler.retrieveTokens(
        netatmoHandler,
        configuration,
        badBody,
      );
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(netatmoHandler.status).to.eq(STATUS.NOT_INITIALIZED);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.PROCESSING_TOKEN },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.NOT_INITIALIZED },
    });
  });
  it('should retrieve tokens successfully', async () => {
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

    const response = await netatmoHandler.retrieveTokens(
      netatmoHandler,
      configuration,
      body,
    );
    // Checking the results
    expect(response).to.deep.equal({ success: true });
    expect(netatmoHandler.status).to.equal(STATUS.CONNECTED);
    expect(netatmoHandler.configured).to.eq(true);
    expect(response).to.deep.equal({ success: true });

    // Checking that setTokens was called with the correct tokens
    expect(setTokensSpy.calledOnce).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('access_token', 'fake_access_token'))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('refresh_token', 'fake_refresh_token'))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('expire_in', 10800))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('connected', true))).to.be.true;

    // Cleaning
    setTokensSpy.restore();
    nock.isDone();

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
  });
  it('should handle errors in retrieveTokens', async () => {
    nock(`${netatmoHandler.baseUrl}`)
      .persist()
      .post('/oauth2/token')
      .reply(500, { error: 'Server Error' }); // Simule une erreur serveur

    netatmoHandler.stateGetAccessToken = 'state'
    await assertJS.rejects(
      async () => {
        await netatmoHandler.retrieveTokens(netatmoHandler, configuration, body);
      },
      (err) => {
        assertJS(err instanceof ServiceNotConfiguredError);
        assertJS(netatmoHandler.status === STATUS.ERROR);
        return true;
      }
    );
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.PROCESSING_TOKEN },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.ERROR },
    });
    nock.isDone();
  });
});