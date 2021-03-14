const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const AwoxManager = require('../../../../../services/awox/lib');

describe('awox.prepareDevice', () => {
  const bluetooth = {};
  const gladys = {};
  const serviceId = '9811285e-9f26-4af3-a291-3c3e6b9c7e04';
  let manager;

  beforeEach(() => {
    manager = new AwoxManager(gladys, serviceId);
    manager.bluetooth = bluetooth;
    manager.handlers = {
      H1: {
        getDevice: fake.returns({ features: [] }),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('loop over handlers', async () => {
    bluetooth.getPeripheral = fake.returns({});

    const device = { external_id: 'bluetooth:uuid' };
    const data = 'DATA';

    const awoxDevice = manager.prepareDevice(device, 'H1', data);
    expect(awoxDevice).deep.eq({
      external_id: 'bluetooth:uuid',
      features: [],
      params: [
        {
          name: 'awoxType',
          value: 'H1',
        },
      ],
    });

    assert.calledOnce(manager.handlers.H1.getDevice);
    assert.calledWith(manager.handlers.H1.getDevice, device, data);
  });
});
