const sinon = require('sinon');

const { assert, fake } = sinon;
const GoogleActionsService = require('../../../services/google-actions');

const gladys = {
  variable: {
    getValue: fake.resolves('MY_PROJECT'),
  },
  oauth: {
    getClient: fake.resolves({
      redirect_uris: [`https://oauth-redirect.googleusercontent.com/r/MY_PROJECT`],
    }),
    updateClientStatus: fake.resolves(true),
  },
  event: {
    on: fake.resolves(true),
    removeListener: fake.returns(true),
  },
};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActionsService', () => {
  beforeEach(() => {
    sinon.reset();
  });

  const googleActionsService = GoogleActionsService(gladys, serviceId);
  it('should start service (not initailzed)', async () => {
    await googleActionsService.start();
    assert.calledWith(gladys.oauth.getClient, 'google-actions');
    assert.calledWith(gladys.variable.getValue, 'GOOGLEACTIONS_PROJECT_KEY', serviceId);
    assert.callCount(gladys.event.on, 4);
  });

  it('should stop service', async () => {
    await googleActionsService.stop();
    assert.calledOnce(gladys.oauth.updateClientStatus);
    assert.callCount(gladys.event.removeListener, 4);
  });
});
