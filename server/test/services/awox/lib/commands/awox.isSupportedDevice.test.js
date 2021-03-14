const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const AwoxManager = require('../../../../../services/awox/lib');

describe('awox.isSupportedDevice', () => {
  const bluetooth = {};
  const gladys = {};
  const serviceId = '9811285e-9f26-4af3-a291-3c3e6b9c7e04';
  let manager;

  beforeEach(() => {
    manager = new AwoxManager(gladys, serviceId);
    manager.bluetooth = bluetooth;
    manager.handlers = {
      H1: {
        isSupportedDevice: fake.returns(false),
      },
      H2: {
        isSupportedDevice: fake.returns(true),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('loop over handlers', async () => {
    bluetooth.getPeripheral = fake.returns({});

    const device = { external_id: 'bluetooth:uuid' };

    const awoxDevice = manager.isSupportedDevice(device);
    expect(awoxDevice).to.eq(true);

    assert.calledOnce(manager.handlers.H1.isSupportedDevice);
    assert.calledWith(manager.handlers.H1.isSupportedDevice, device, {});

    assert.calledOnce(manager.handlers.H2.isSupportedDevice);
    assert.calledWith(manager.handlers.H2.isSupportedDevice, device, {});
  });
});
