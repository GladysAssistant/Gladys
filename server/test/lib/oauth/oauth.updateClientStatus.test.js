const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const OauthManager = require('../../../lib/oauth');
const { NotFoundError } = require('../../../utils/coreErrors');

describe('oauth.updateClientStatus', () => {
  const sessionManager = {
    cache: {
      set: fake.returns(true),
    },
  };
  const oauthManager = new OauthManager({}, sessionManager);

  afterEach(() => {
    sinon.reset();
  });

  it('should update OAuth client status', async () => {
    const status = await oauthManager.updateClientStatus('oauth_client_1', true);
    expect(status).to.eq(true);

    assert.notCalled(sessionManager.cache.set);
  });

  it('should update OAuth client status and revoke session', async () => {
    const status = await oauthManager.updateClientStatus('oauth_client_1', false);
    expect(status).to.eq(false);

    assert.calledTwice(sessionManager.cache.set);
  });

  it('should fail on update OAuth missing client status', async () => {
    try {
      await oauthManager.updateClientStatus('oauth_client_unkown', true);
      expect.fail('Should fail on unknown client');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }

    assert.notCalled(sessionManager.cache.set);
  });
});
