const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { storeTokens } = require('../../../../../services/melcloud-home/lib/auth/melcloud-home.storeTokens');
const { GLADYS_VARIABLES } = require('../../../../../services/melcloud-home/lib/utils/melcloud-home.constants');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeHandler.storeTokens', () => {
  let context;

  beforeEach(() => {
    sinon.reset();
    context = {
      serviceId,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      gladys: { variable: { setValue: fake.resolves(null) } },
    };
  });

  it('should store access and refresh tokens and persist the refresh token', async () => {
    await storeTokens.call(context, { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 });

    expect(context.accessToken).to.equal('access');
    expect(context.refreshToken).to.equal('refresh');
    expect(context.tokenExpiresAt).to.be.a('number');
    assert.calledWith(context.gladys.variable.setValue, GLADYS_VARIABLES.REFRESH_TOKEN, 'refresh', serviceId);
  });

  it('should keep the previous refresh token when the response has none and use default expiry', async () => {
    context.refreshToken = 'previous';
    await storeTokens.call(context, { access_token: 'access' });

    expect(context.refreshToken).to.equal('previous');
    assert.calledWith(context.gladys.variable.setValue, GLADYS_VARIABLES.REFRESH_TOKEN, 'previous', serviceId);
  });

  it('should not persist a refresh token when there is none', async () => {
    await storeTokens.call(context, { access_token: 'access' });

    expect(context.refreshToken).to.equal(null);
    assert.notCalled(context.gladys.variable.setValue);
  });
});
