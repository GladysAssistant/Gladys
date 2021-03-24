const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const gladys = {
  variable: {
    getValue: fake.resolves('MY_PROJECT'),
  },
  oauth: {
    getClient: fake.resolves({
      active: true,
      redirect_uris: [`https://oauth-redirect.googleusercontent.com/r/MY_PROJECT`],
    }),
    updateClientStatus: fake.resolves(true),
  },
  user: {
    get: fake.resolves([
      {
        id: 1,
      },
      {
        id: 2,
      },
    ]),
  },
  event: {
    on: fake.resolves(true),
  },
};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActions Handler - init', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('init', async () => {
    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    await googleActionsHandler.init();
    expect(googleActionsHandler.smarthome).to.not.eq(null);
    assert.calledWith(gladys.oauth.getClient, 'google-actions');
    assert.calledWith(gladys.variable.getValue, 'GOOGLEACTIONS_PROJECT_KEY', serviceId);
    assert.callCount(gladys.event.on, 4);
    assert.notCalled(gladys.oauth.updateClientStatus);
  });
});
