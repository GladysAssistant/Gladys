const { expect } = require('chai');
const sinon = require('sinon');
const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require('undici');

const { fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  stateManager: {
    get: sinon.stub().resolves(),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);
const { refreshingTokens } = netatmoHandler;

describe('Netatmo pollRefreshingToken', () => {
  let clock;
  let tokens;
  let mockAgent;
  let netatmoMock;
  let originalDispatcher;
  const restoreClock = () => {
    if (clock) {
      clock.restore();
      clock = null;
    }
  };

  beforeEach(() => {
    sinon.reset();

    // Store the original dispatcher
    originalDispatcher = getGlobalDispatcher();

    // MockAgent setup
    mockAgent = new MockAgent();
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();
    netatmoMock = mockAgent.get('https://api.netatmo.com');

    clock = sinon.useFakeTimers();
    netatmoHandler.refreshingTokens = refreshingTokens;
    netatmoHandler.status = 'not_initialized';
    netatmoHandler.configuration = {
      clientId: 'valid_client_id',
      clientSecret: 'valid_client_secret',
      scopes: { scopeEnergy: 'scope' },
    };
    netatmoHandler.accessToken = 'valid_access_token';
    netatmoHandler.refreshToken = 'valid_refresh_token';
    netatmoHandler.expireInToken = 3600;
    netatmoHandler.reconnectAttempt = 0;
    netatmoHandler.reconnectTimeout = undefined;
    tokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expire_in: 3600,
    };
  });

  afterEach(() => {
    clearInterval(netatmoHandler.pollRefreshToken);
    clearTimeout(netatmoHandler.reconnectTimeout);
    netatmoHandler.pollRefreshToken = undefined;
    netatmoHandler.reconnectTimeout = undefined;
    netatmoHandler.reconnectAttempt = 0;
    restoreClock();
    sinon.reset();
    // Clean up the mock agent
    mockAgent.close();
    // Restore the original dispatcher
    setGlobalDispatcher(originalDispatcher);
  });

  it('should refresh tokens periodically', async () => {
    netatmoHandler.refreshingTokens = sinon.stub().resolves({ success: true });

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    sinon.assert.calledOnce(netatmoHandler.refreshingTokens);

    netatmoHandler.refreshingTokens = refreshingTokens;
    tokens.refresh_token = 'new-refresh-token2';

    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(200, tokens);

    clock.tick(3600 * 1000);
    restoreClock();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(netatmoHandler.accessToken).to.equal('new-access-token');
    expect(netatmoHandler.refreshToken).to.equal('new-refresh-token2');
    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_ACCESS_TOKEN',
      'new-access-token',
      serviceId,
    );
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_REFRESH_TOKEN',
      'new-refresh-token2',
      serviceId,
    );
    sinon.assert.calledWith(netatmoHandler.gladys.variable.setValue, 'NETATMO_EXPIRE_IN_TOKEN', 3600, serviceId);
  });

  it('should handle token expiration change correctly', async () => {
    netatmoHandler.refreshingTokens = sinon.stub().callsFake(async () => {
      netatmoHandler.expireInToken = 7200;
      return { success: true };
    });
    const initialExpireInToken = netatmoHandler.expireInToken;
    const pollRefreshingTokenSpy = sinon.spy(netatmoHandler, 'pollRefreshingToken');

    await netatmoHandler.pollRefreshingToken();
    const pollRefreshTokenIdBefore = netatmoHandler.pollRefreshToken.id;

    clock.tick(initialExpireInToken * 1000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.pollRefreshToken.id).to.not.equal(pollRefreshTokenIdBefore);
    expect(pollRefreshingTokenSpy.callCount).to.be.greaterThan(0);

    pollRefreshingTokenSpy.restore();
    netatmoHandler.refreshingTokens = refreshingTokens;
  });

  it('should not set interval if expireInToken is null', async () => {
    netatmoHandler.expireInToken = null;
    const refreshingTokensSpy = sinon.spy(netatmoHandler, 'refreshingTokens');

    await netatmoHandler.pollRefreshingToken();

    sinon.assert.notCalled(refreshingTokensSpy);

    refreshingTokensSpy.restore();
  });

  it('should bootstrap value polling on retry success when not already started', async () => {
    const transient = new Error('transient');
    transient.transient = true;
    netatmoHandler.refreshingTokens = sinon
      .stub()
      .onFirstCall()
      .rejects(transient)
      .onSecondCall()
      .resolves({ success: true });
    const refreshNetatmoValuesStub = sinon.stub().resolves();
    const pollRefreshingValuesStub = sinon.stub();
    netatmoHandler.refreshNetatmoValues = refreshNetatmoValuesStub;
    netatmoHandler.pollRefreshingValues = pollRefreshingValuesStub;
    netatmoHandler.pollRefreshValues = undefined;

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    await Promise.resolve();
    await Promise.resolve();

    clock.tick(30 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    sinon.assert.calledOnce(refreshNetatmoValuesStub);
    sinon.assert.calledOnce(pollRefreshingValuesStub);

    netatmoHandler.refreshingTokens = refreshingTokens;
  });

  it('should skip arming pollRefreshingValues and keep reconnectAttempt > 0 when bootstrap leaves status RECONNECTING', async () => {
    const transient = new Error('transient');
    transient.transient = true;
    netatmoHandler.refreshingTokens = sinon
      .stub()
      .onFirstCall()
      .rejects(transient)
      .onSecondCall()
      .resolves({ success: true });
    const pollRefreshingValuesStub = sinon.stub();
    netatmoHandler.refreshNetatmoValues = sinon.stub().callsFake(async () => {
      netatmoHandler.status = 'reconnecting';
    });
    netatmoHandler.pollRefreshingValues = pollRefreshingValuesStub;
    netatmoHandler.pollRefreshValues = undefined;

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    await Promise.resolve();
    await Promise.resolve();

    clock.tick(30 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    sinon.assert.notCalled(pollRefreshingValuesStub);
    expect(netatmoHandler.reconnectAttempt).to.be.greaterThan(0);

    clearTimeout(netatmoHandler.reconnectTimeout);
    netatmoHandler.reconnectTimeout = undefined;
    netatmoHandler.reconnectAttempt = 0;
    netatmoHandler.refreshingTokens = refreshingTokens;
  });

  it('should not bootstrap value polling on retry success when already started', async () => {
    const transient = new Error('transient');
    transient.transient = true;
    netatmoHandler.refreshingTokens = sinon
      .stub()
      .onFirstCall()
      .rejects(transient)
      .onSecondCall()
      .resolves({ success: true });
    const refreshNetatmoValuesStub = sinon.stub().resolves();
    const pollRefreshingValuesStub = sinon.stub();
    netatmoHandler.refreshNetatmoValues = refreshNetatmoValuesStub;
    netatmoHandler.pollRefreshingValues = pollRefreshingValuesStub;
    netatmoHandler.pollRefreshValues = setInterval(() => {}, 120 * 1000);

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    await Promise.resolve();
    await Promise.resolve();

    clock.tick(30 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    sinon.assert.notCalled(refreshNetatmoValuesStub);
    sinon.assert.notCalled(pollRefreshingValuesStub);

    clearInterval(netatmoHandler.pollRefreshValues);
    netatmoHandler.pollRefreshValues = undefined;
    netatmoHandler.refreshingTokens = refreshingTokens;
  });

  it('should schedule a 30s retry after a transient error', async () => {
    const transient = new Error('transient');
    transient.transient = true;
    netatmoHandler.refreshingTokens = sinon
      .stub()
      .onFirstCall()
      .rejects(transient)
      .onSecondCall()
      .resolves({ success: true });

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    sinon.assert.calledOnce(netatmoHandler.refreshingTokens);
    expect(netatmoHandler.reconnectAttempt).to.equal(1);

    clock.tick(30 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    sinon.assert.calledTwice(netatmoHandler.refreshingTokens);
    expect(netatmoHandler.reconnectAttempt).to.equal(0);

    netatmoHandler.refreshingTokens = refreshingTokens;
  });

  it('should follow the backoff cadence 30s/60s/120s/300s/300s on repeated transient errors', async () => {
    const transient = new Error('transient');
    transient.transient = true;
    netatmoHandler.refreshingTokens = sinon.stub().rejects(transient);

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    sinon.assert.calledOnce(netatmoHandler.refreshingTokens);
    expect(netatmoHandler.reconnectAttempt).to.equal(1);

    clock.tick(30 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.refreshingTokens.callCount).to.equal(2);
    expect(netatmoHandler.reconnectAttempt).to.equal(2);

    clock.tick(60 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.refreshingTokens.callCount).to.equal(3);
    expect(netatmoHandler.reconnectAttempt).to.equal(3);

    clock.tick(120 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.refreshingTokens.callCount).to.equal(4);
    expect(netatmoHandler.reconnectAttempt).to.equal(4);

    clock.tick(300 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.refreshingTokens.callCount).to.equal(5);
    expect(netatmoHandler.reconnectAttempt).to.equal(5);

    // recurrent 300s
    clock.tick(300 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.refreshingTokens.callCount).to.equal(6);
    expect(netatmoHandler.reconnectAttempt).to.equal(6);

    netatmoHandler.refreshingTokens = refreshingTokens;
  });

  it('should not schedule a retry when the periodic tick throws a non-transient error', async () => {
    netatmoHandler.refreshingTokens = sinon.stub().rejects(new Error('fatal'));

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    sinon.assert.calledOnce(netatmoHandler.refreshingTokens);
    expect(netatmoHandler.reconnectAttempt).to.equal(0);
    expect(netatmoHandler.reconnectTimeout).to.equal(undefined);

    netatmoHandler.refreshingTokens = refreshingTokens;
  });

  it('should stop retries on non-transient error during retry attempt', async () => {
    const transient = new Error('transient');
    transient.transient = true;
    netatmoHandler.refreshingTokens = sinon
      .stub()
      .onFirstCall()
      .rejects(transient)
      .onSecondCall()
      .rejects(new Error('fatal'));

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.reconnectAttempt).to.equal(1);

    clock.tick(30 * 1000);
    await Promise.resolve();
    await Promise.resolve();
    expect(netatmoHandler.refreshingTokens.callCount).to.equal(2);
    expect(netatmoHandler.reconnectAttempt).to.equal(0);
    expect(netatmoHandler.reconnectTimeout).to.equal(undefined);

    netatmoHandler.refreshingTokens = refreshingTokens;
  });
});
