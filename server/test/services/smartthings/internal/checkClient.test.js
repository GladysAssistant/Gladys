const sinon = require('sinon');

const { assert, fake } = sinon;
const SmartthingsHandler = require('../../../../services/smartthings/lib');

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const gladys = {
  oauth: {
    createClient: fake.resolves(null),
  },
};

describe('SmartThings service - checkClient', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('checkClient with success', () => {
    gladys.oauth.getClient = fake.resolves({});
    smartthingsHandler.checkClient();

    assert.calledWith(gladys.oauth.getClient, 'smartthings');
    assert.notCalled(gladys.oauth.createClient);
  });

  it('checkClient with error', () => {
    gladys.oauth.getClient = fake.resolves(null);
    smartthingsHandler.checkClient();

    assert.calledWith(gladys.oauth.getClient, 'smartthings');
    assert.calledWith(gladys.oauth.createClient, {
      id: 'smartthings',
      name: 'Samsung SmartThings',
      redirect_uris: [
        'https://c2c-us.smartthings.com/oauth/callback',
        'https://c2c-eu.smartthings.com/oauth/callback',
        'https://c2c-ap.smartthings.com/oauth/callback',
      ],
      grants: ['authorization_code'],
    });
  });
});
