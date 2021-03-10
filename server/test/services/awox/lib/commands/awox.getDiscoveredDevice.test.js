const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const AwoxManager = require('../../../../../services/awox/lib');
const { NotFoundError, BadParameters } = require('../../../../../utils/coreErrors');

describe('awox.getDiscoveredDevice', () => {
  const bluetooth = {};
  const gladys = {
    service: {
      getService: () => {
        return { device: bluetooth };
      },
    },
  };
  const serviceId = '9811285e-9f26-4af3-a291-3c3e6b9c7e04';
  let manager;

  beforeEach(() => {
    manager = new AwoxManager(gladys, serviceId);
    manager.start();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('device not discovered', async () => {
    bluetooth.getDiscoveredDevice = fake.returns(null);

    try {
      manager.getDiscoveredDevice('any');
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
    }

    assert.calledOnce(bluetooth.getDiscoveredDevice);
  });

  it('not an AwoX device', async () => {
    bluetooth.getDiscoveredDevice = fake.returns({ external_id: 'bluetooth:any' });
    bluetooth.getPeripheral = fake.returns({});

    try {
      manager.getDiscoveredDevice('any');
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
    }

    assert.calledOnce(bluetooth.getDiscoveredDevice);
    assert.calledOnce(bluetooth.getPeripheral);
  });

  it('found AwoX device', async () => {
    bluetooth.getDiscoveredDevice = fake.returns({ external_id: 'bluetooth:any', model: 'SML-w7' });
    bluetooth.getPeripheral = fake.returns({});

    const awoxDevices = manager.getDiscoveredDevice('any');

    assert.calledOnce(bluetooth.getDiscoveredDevice);
    assert.calledOnce(bluetooth.getPeripheral);
    expect(awoxDevices).deep.eq({
      external_id: 'bluetooth:any',
      features: [
        {
          category: 'light',
          external_id: 'bluetooth:any:binary',
          max: 1,
          min: 0,
          type: 'binary',
          read_only: false,
          name: 'Switch',
          has_feedback: true,
        },
        {
          category: 'light',
          external_id: 'bluetooth:any:brightness',
          max: 100,
          min: 0,
          type: 'brightness',
          read_only: false,
          name: 'Brightness',
          has_feedback: true,
        },
        {
          category: 'light',
          external_id: 'bluetooth:any:temperature',
          max: 100,
          min: 0,
          type: 'temperature',
          read_only: false,
          name: 'Color temperature',
          has_feedback: true,
        },
      ],
      model: 'SML-w7',
      params: [
        {
          name: 'awoxType',
          value: 'legacy',
        },
      ],
    });
  });
});
