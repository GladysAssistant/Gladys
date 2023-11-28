const { expect } = require('chai');
const sinon = require('sinon');
const crypto = require('crypto');
const AxiosMockAdapter = require('axios-mock-adapter');
const axios = require('axios').default;
const querystring = require('querystring');
const proxyquire = require('proxyquire').noCallThru();
const { NetatmoContext } = require('../netatmo.mock.test');

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

describe('NetatmoHandler.connect', () => {
  const netatmoHandler = new NetatmoHandler(gladys, serviceId);

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
    assert.notCalled(gladys.event.emit);
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

    assert.notCalled(gladys.event.emit);
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

    assert.notCalled(gladys.event.emit);
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
  let mock;
  beforeEach(() => {
    sinon.reset();
    netatmoHandler.status = 'UNKNOWN';
    mock = new AxiosMockAdapter(axios);
    // Configurez ici les réponses mockées
    mock.onPost('https://api.netatmo.net/oauth2/token').reply(200, {
      access_token: 'fake_access_token',
      refresh_token: 'fake_refresh_token'
    });
  });

  afterEach(() => {
    sinon.reset();
    mock.restore();
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
    assert.notCalled(gladys.event.emit);
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

    assert.notCalled(gladys.event.emit);
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

    assert.notCalled(gladys.event.emit);
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

    assert.notCalled(gladys.event.emit);
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

    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.PROCESSING_TOKEN },
    });
  });
  it.only('should retrieve tokens successfully', async () => {
    netatmoHandler.stateGetAccessToken = 'state'
    const response = await netatmoHandler.retrieveTokens(
      netatmoHandler,
      configuration,
      body,
    );
    // Testez le comportement attendu ici
    expect(response).to.deep.equal({ success: true });
    expect(netatmoHandler.status).to.equal(STATUS.CONNECTED);
    expect(netatmoHandler.configured).to.eq(true);


    expect(response).to.deep.equal({ success: true });
    // expect(mock).to.have.been.calledOnceWith({
    //   url: `${netatmoHandler.baseUrl}/oauth2/token`,
    //   method: 'post',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Host: 'api.netatmo.com' },
    //   data: querystring.stringify({
    //     grant_type: 'authorization_code',
    //     client_id: configuration.clientId,
    //     client_secret: configuration.clientSecret,
    //     redirect_uri: body.redirectUri,
    //     scope: configuration.scopes.scopeEnergy,
    //     code: body.codeOAuth,
    //   })
    // });

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
});