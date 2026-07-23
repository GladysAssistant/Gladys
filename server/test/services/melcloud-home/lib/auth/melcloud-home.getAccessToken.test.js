const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

describe('MELCloudHomeHandler.getAccessToken', () => {
  let oauthMock;
  let getAccessToken;

  beforeEach(() => {
    sinon.reset();
    oauthMock = { refresh: fake.resolves({ access_token: 'new-access', refresh_token: 'new-refresh' }) };
    ({ getAccessToken } = proxyquire('../../../../../services/melcloud-home/lib/auth/melcloud-home.getAccessToken', {
      './melcloud-home.oauth': oauthMock,
    }));
  });

  it('should return the cached token when it is still valid', async () => {
    const context = { accessToken: 'cached', tokenExpiresAt: Date.now() + 100000 };
    const token = await getAccessToken.call(context);
    expect(token).to.equal('cached');
    assert.notCalled(oauthMock.refresh);
  });

  it('should throw when there is no refresh token', async () => {
    const context = { accessToken: null, tokenExpiresAt: null, refreshToken: null };
    let error;
    try {
      await getAccessToken.call(context);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(ServiceNotConfiguredError);
  });

  it('should refresh an expired token', async () => {
    const context = {
      accessToken: 'old',
      tokenExpiresAt: Date.now() - 1000,
      refreshToken: 'refresh',
      storeTokens: fake(async function storeTokens(tokens) {
        this.accessToken = tokens.access_token;
      }),
    };
    const token = await getAccessToken.call(context);
    expect(token).to.equal('new-access');
    assert.calledOnce(oauthMock.refresh);
  });
});
