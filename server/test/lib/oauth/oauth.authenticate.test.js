const sinon = require('sinon');

const { fake, assert } = sinon;
const { Cache } = require('../../../utils/cache');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');
const SessionManager = require('../../../lib/session');
const { generateAccessToken } = require('../../../utils/accessToken');

describe('oauth.authenticate', () => {
  const cache = new Cache();
  const oauthManager = new OauthManager(new UserManager(), new SessionManager('secret', cache));

  beforeEach(() => {
    sinon.reset();
  });

  it('authenticate with success', async () => {
    const token = generateAccessToken(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      ['dashboard:read', 'reset-password:write'],
      '1ec7c3d5-f806-4920-97b3-3e75e19b6434',
      'secret',
    );

    const req = { headers: { Authorization: `Bearer ${token}` }, method: 'POST', query: {} };
    const res = { set: fake.returns(null), status: fake.returns(null), send: fake.returns(null) };
    const callback = fake.returns(null);

    await oauthManager.authenticate(req, res, callback);

    assert.calledWith(callback, req, res);
    assert.notCalled(res.set);
    assert.notCalled(res.status);
    assert.notCalled(res.send);
  });

  it('authenticate failed', async () => {
    const req = { headers: { Authorization: `Bearer invalid` }, method: 'POST', query: {} };
    const res = { set: fake.returns(null), status: fake.returns(null), send: fake.returns(null) };
    const callback = fake.returns(null);

    await oauthManager.authenticate(req, res, callback);

    assert.notCalled(callback);
    assert.calledOnce(res.set);
    assert.calledOnce(res.status);
    assert.calledOnce(res.send);
  });
});
