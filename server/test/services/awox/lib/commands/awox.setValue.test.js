const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const AwoxManager = require('../../../../../services/awox/lib');

describe('awox.setValue', () => {
  const gladys = {};
  const serviceId = '9811285e-9f26-4af3-a291-3c3e6b9c7e04';
  let manager;

  beforeEach(() => {
    manager = new AwoxManager(gladys, serviceId);
    manager.handlers = {
      H1: {
        setValue: fake.returns(false),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('device misses param', async () => {
    const device = { name: 'device-name', params: [] };
    const feature = {};
    const value = 1;

    try {
      await manager.setValue(device, feature, value);
      assert.fail();
    } catch (e) {
      expect(e.message).eq(`AwoX: No handler matching device ${device.name}`);
    }

    assert.notCalled(manager.handlers.H1.setValue);
  });

  it('device known param', async () => {
    const device = {
      name: 'device-name',
      params: [
        {
          name: 'awoxType',
          value: 'H1',
        },
      ],
    };
    const feature = {};
    const value = 1;

    await manager.setValue(device, feature, value);

    assert.calledOnce(manager.handlers.H1.setValue);
    assert.calledWith(manager.handlers.H1.setValue, device, feature, value);
  });
});
