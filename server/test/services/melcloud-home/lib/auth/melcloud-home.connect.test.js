const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { STATUS } = require('../../../../../services/melcloud-home/lib/utils/melcloud-home.constants');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

describe('MELCloudHomeHandler.connect', () => {
  let oauthMock;
  let connect;
  let context;

  const buildContext = () => ({
    gladys: { event: { emit: fake.returns(null) } },
    storeTokens: fake.resolves(null),
  });

  beforeEach(() => {
    sinon.reset();
    oauthMock = {
      login: fake.resolves({ access_token: 'access', refresh_token: 'refresh' }),
      refresh: fake.resolves({ access_token: 'access', refresh_token: 'refresh' }),
    };
    ({ connect } = proxyquire('../../../../../services/melcloud-home/lib/auth/melcloud-home.connect', {
      './melcloud-home.oauth': oauthMock,
    }));
    context = buildContext();
  });

  it('should throw when not configured', async () => {
    let error;
    try {
      await connect.call(context, {});
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(ServiceNotConfiguredError);
    expect(context.status).to.equal(STATUS.NOT_INITIALIZED);
  });

  it('should connect using the refresh token', async () => {
    await connect.call(context, { refreshToken: 'refresh' });
    assert.calledOnce(oauthMock.refresh);
    assert.notCalled(oauthMock.login);
    expect(context.status).to.equal(STATUS.CONNECTED);
  });

  it('should connect using credentials', async () => {
    await connect.call(context, { username: 'user', password: 'pass' });
    assert.calledOnce(oauthMock.login);
    expect(context.status).to.equal(STATUS.CONNECTED);
  });

  it('should fall back to credentials when the refresh token is invalid', async () => {
    oauthMock.refresh = fake.rejects(new Error('invalid refresh token'));
    await connect.call(context, { refreshToken: 'refresh', username: 'user', password: 'pass' });
    assert.calledOnce(oauthMock.login);
    expect(context.status).to.equal(STATUS.CONNECTED);
  });

  it('should error when both refresh and credentials fallback fail', async () => {
    oauthMock.refresh = fake.rejects(new Error('invalid refresh token'));
    oauthMock.login = fake.rejects(new Error('bad credentials'));
    await connect.call(context, { refreshToken: 'refresh', username: 'user', password: 'pass' });
    expect(context.status).to.equal(STATUS.ERROR);
  });

  it('should error when a credentials-only login fails', async () => {
    oauthMock.login = fake.rejects(new Error('bad credentials'));
    await connect.call(context, { username: 'user', password: 'pass' });
    expect(context.status).to.equal(STATUS.ERROR);
  });
});
