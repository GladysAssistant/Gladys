const sinon = require('sinon');

const { assert, spy, fake } = sinon;
const SmartthingsHandler = require('../../../../services/smartthings/lib');
const { VARIABLES } = require('../../../../services/smartthings/utils/constants');

const userId = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const gladys = {
  variable: {
    setValue: spy(),
  },
  session: {
    validateAccessToken: fake.returns({
      user_id: userId,
    }),
  },
};

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const accessToken = 'smartthings-access-token';
const callbackAuthentication = {
  grantType: 'authorization_code',
  scope: 'callback_access',
  code: 'xxxxxxxxxxx',
  clientId: 'Client ID given to partner in Workspace during app creation',
};
const callbackUrls = {
  oauthToken: 'Callback URL for access-token-request.json and refresh-access-tokens.json requests',
  stateCallback: 'Callback URL for state-callback.json updates',
};

describe('SmartThings service - callbackAccessHandler', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('should store callback URLs', async () => {
    await smartthingsHandler.callbackAccessHandler(accessToken, callbackAuthentication, callbackUrls);

    assert.callCount(gladys.variable.setValue, 1);
    assert.calledWith(
      gladys.variable.setValue.getCall(0),
      VARIABLES.SMT_CALLBACK_OAUTH,
      JSON.stringify({
        callbackAuthentication,
        callbackUrls,
      }),
      serviceId,
      userId,
    );
  });
});
