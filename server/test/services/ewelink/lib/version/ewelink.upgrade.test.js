const sinon = require('sinon');

const { stub, assert } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler init', () => {
  let eWeLinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: stub().resolves(null),
        setValue: stub(),
        destroy: stub(),
      },
    };

    eWeLinkHandler = new EwelinkHandler(gladys, null, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not apply updates', async () => {
    gladys.variable.getValue.onFirstCall().resolves('10000');

    await eWeLinkHandler.upgrade();

    assert.calledOnceWithExactly(gladys.variable.getValue, 'SERVICE_VERSION', SERVICE_ID);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);
  });

  it('should apply all updates', async () => {
    await eWeLinkHandler.upgrade();

    assert.calledOnceWithExactly(gladys.variable.getValue, 'SERVICE_VERSION', SERVICE_ID);

    assert.callCount(gladys.variable.destroy, 3);
    assert.callCount(gladys.variable.setValue, 1);

    // v2
    assert.calledWithExactly(gladys.variable.destroy, 'EWELINK_EMAIL', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.destroy, 'EWELINK_PASSWORD', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.destroy, 'EWELINK_REGION', SERVICE_ID);
    assert.calledWithExactly(gladys.variable.setValue, 'SERVICE_VERSION', '2', SERVICE_ID);
  });
});
