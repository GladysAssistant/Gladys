const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

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

  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    clock = sinon.useFakeTimers();
    netatmoHandler.status = 'not_initialized';
    netatmoHandler.configuration = {
      clientId: 'valid_client_id',
      clientSecret: 'valid_client_secret',
      scopes: { scopeEnergy: 'scope' },
    };
    netatmoHandler.accessToken = 'valid_access_token';
    netatmoHandler.refreshToken = 'valid_refresh_token';
    netatmoHandler.expireInToken = 3600;
    tokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expire_in: 3600,
    };
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
    nock.cleanAll();
  });

  it('should refresh tokens periodically', async () => {
    netatmoHandler.refreshingTokens = sinon.stub().resolves({ success: true });

    await netatmoHandler.pollRefreshingToken();

    clock.tick(3600 * 1000);
    sinon.assert.calledOnce(netatmoHandler.refreshingTokens);

    netatmoHandler.refreshingTokens = refreshingTokens;
    tokens.refresh_token = 'new-refresh-token2';
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .reply(200, tokens);

    clock.tick(3600 * 1000);
    clock.restore();
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
    const pollRefreshTokenId = netatmoHandler.pollRefreshToken.id;

    await netatmoHandler.pollRefreshingToken();

    clock.tick(initialExpireInToken * 1000);
    expect(netatmoHandler.pollRefreshToken.id).to.equal(pollRefreshTokenId + 1);
    expect(netatmoHandler.pollRefreshingToken.callCount).to.equal(1);
    sinon.assert.calledOnce(pollRefreshingTokenSpy);

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
});
