const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const AwoxManager = require('../../../../../services/awox/lib');

describe('awox.start', () => {
  const bluetooth = {
    device: 'bluetooth_device',
  };
  const gladys = {
    service: {
      getService: fake.returns(bluetooth),
    },
  };
  const serviceId = '9811285e-9f26-4af3-a291-3c3e6b9c7e04';
  let manager;

  beforeEach(() => {
    manager = new AwoxManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start manager', async () => {
    await manager.start();

    assert.calledWith(gladys.service.getService, 'bluetooth');
    expect(manager.bluetooth).is.eq('bluetooth_device');
    expect(manager.handlers).to.have.keys('legacy', 'mesh');
  });
});
