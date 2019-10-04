const sinon = require('sinon');

const { assert, spy } = sinon;
const SmartthingsHandler = require('../../../../services/smartthings/lib');
const { VARIABLES } = require('../../../../services/smartthings/utils/constants');

const gladys = {
  variable: {
    setValue: spy(),
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

    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWith(
      gladys.variable.setValue.getCall(0),
      VARIABLES.SMT_TOKEN_CALLBACK_URL,
      callbackUrls.oauthToken,
      serviceId,
    );
    assert.calledWith(
      gladys.variable.setValue.getCall(1),
      VARIABLES.SMT_STATE_CALLBACK_URL,
      callbackUrls.stateCallback,
      serviceId,
    );
  });
});
