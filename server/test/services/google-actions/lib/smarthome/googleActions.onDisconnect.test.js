const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const gladys = {
  oauth: {
    revokeToken: fake.resolves(true),
  },
  variable: {
    destroy: fake.resolves(true),
  },
};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActions Handler - onDisconnect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('onDisconnect', async () => {
    const body = {
      user: {
        id: 'user-id',
      },
    };
    const headers = {
      authentication: 'Bearer my-bearer-token',
    };

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onDisconnect(body, headers);
    expect(result).to.eq(true);
    assert.calledOnce(gladys.oauth.revokeToken);
    assert.calledWith(gladys.variable.destroy, 'GOOGLEACTIONS_USER', serviceId, 'user-id');
  });
});
