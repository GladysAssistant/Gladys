const sinon = require('sinon');
const { fake, assert } = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
};

const WithingsService = proxyquire('../../../services/withings', {});

describe('withingsService', () => {
  // let countGetValueCount = 0;
  const withingsService = WithingsService(gladys);

  it('should start service', async () => {
    await withingsService.start();

    expect(withingsService).to.have.property('controllers');
    expect(withingsService).to.have.property('device');

    assert.callCount(gladys.variable.getValue, 1);
    assert.callCount(gladys.variable.setValue, 8);
  });

  it('should stop service', async () => {
    sinon.reset();
    await withingsService.stop();

    assert.notCalled(gladys.variable.getValue);
    assert.notCalled(gladys.variable.setValue);
  });
});
