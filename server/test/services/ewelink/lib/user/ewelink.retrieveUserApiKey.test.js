const sinon = require('sinon');

const { fake, assert } = sinon;

const { expect } = require('chai');
const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

describe('eWeLinkHandler retrieveUserApiKey', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        setValue: fake.resolves(null),
      },
    };

    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
    eWeLinkHandler.ewelinkWebAPIClient = {
      home: {
        getFamily: fake.resolves({
          data: { currentFamilyId: 'current-family', familyList: [{ id: 'current-family', apikey: 'USER-API-KEY' }] },
        }),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw an error as API key is not found', async () => {
    eWeLinkHandler.ewelinkWebAPIClient = {
      home: {
        getFamily: fake.resolves({
          data: {
            currentFamilyId: 'current-family',
            familyList: [{ id: 'not-current-family', apikey: 'USER-API-KEY' }],
          },
        }),
      },
    };

    try {
      await eWeLinkHandler.retrieveUserApiKey();
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.eq('eWeLink: no user API key retrieved');
    }

    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkWebAPIClient.home.getFamily);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should store user API key in database', async () => {
    // Check value is not already set
    expect(eWeLinkHandler.userApiKey).to.eq(null);

    await eWeLinkHandler.retrieveUserApiKey();

    assert.calledOnceWithExactly(eWeLinkHandler.ewelinkWebAPIClient.home.getFamily);
    assert.calledOnceWithExactly(gladys.variable.setValue, 'USER_API_KEY', 'USER-API-KEY', SERVICE_ID);
    expect(eWeLinkHandler.userApiKey).to.eq('USER-API-KEY');
  });
});
