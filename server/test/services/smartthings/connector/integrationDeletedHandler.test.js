const sinon = require('sinon');

const { assert, spy, fake } = sinon;
const SmartthingsHandler = require('../../../../services/smartthings/lib');
const { VARIABLES } = require('../../../../services/smartthings/utils/constants');

const userId = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const gladys = {
  variable: {
    destroy: spy(),
  },
  session: {
    validateAccessToken: fake.returns({
      user_id: userId,
    }),
  },
};

const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
const accessToken = 'smartthings-access-token';

describe('SmartThings service - integrationDeletedHandler', () => {
  const smartthingsHandler = new SmartthingsHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('should destroy callback URLs', async () => {
    await smartthingsHandler.integrationDeletedHandler(accessToken);

    assert.callCount(gladys.variable.destroy, 1);
    assert.calledWith(gladys.variable.destroy.getCall(0), VARIABLES.SMT_CALLBACK_OAUTH, serviceId, userId);
  });
});
