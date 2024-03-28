const sinon = require('sinon');

const { fake, assert } = sinon;

const EwelinkHandler = require('../../../../services/ewelink/lib');
const { SERVICE_ID } = require('./constants');

describe('eWeLinkHandler init', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
    eWeLinkHandler.loadConfiguration = fake.resolves(null);
    eWeLinkHandler.upgrade = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should call both methods', async () => {
    await eWeLinkHandler.init();
    assert.calledOnceWithExactly(eWeLinkHandler.loadConfiguration);
    assert.calledOnceWithExactly(eWeLinkHandler.upgrade);
  });
});
