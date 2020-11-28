const sinon = require('sinon');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';
const gladys = {
  oauth: {
    createClient: fake.resolves({}),
    updateClientStatus: fake.resolves(true),
  },
  variable: {},
};

describe('GoogleActions Handler - checkClient', () => {
  const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('client not exists, create it', async () => {
    const projectKey = 'FIRST_CLIENT';
    gladys.variable.getValue = fake.resolves(projectKey);
    gladys.oauth.getClient = fake.resolves(null);

    await googleActionsHandler.checkClient();

    assert.calledWith(gladys.oauth.getClient, 'google-actions');
    assert.calledWith(gladys.variable.getValue, 'GOOGLEACTIONS_PROJECT_KEY', serviceId);
    assert.calledWith(gladys.oauth.createClient, {
      id: 'google-actions',
      name: 'Google Actions',
      redirect_uris: [`https://oauth-redirect.googleusercontent.com/r/${projectKey}`],
      grants: ['authorization_code', 'refresh_token'],
    });
    assert.notCalled(gladys.oauth.updateClientStatus);
  });

  it('client not active, change status', async () => {
    const projectKey = 'SECOND_CLIENT';
    gladys.variable.getValue = fake.resolves(projectKey);
    gladys.oauth.getClient = fake.resolves({
      redirect_uris: ['https://oauth-redirect.googleusercontent.com/r/SECOND_CLIENT'],
    });

    await googleActionsHandler.checkClient();

    assert.calledWith(gladys.oauth.getClient, 'google-actions');
    assert.calledWith(gladys.variable.getValue, 'GOOGLEACTIONS_PROJECT_KEY', serviceId);
    assert.notCalled(gladys.oauth.createClient);
    assert.calledOnce(gladys.oauth.updateClientStatus);
  });
});
