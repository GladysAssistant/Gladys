const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');

const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.completeDevice command', () => {
  it('no device', () => {
    const gladys = {
      stateManager: {
        get: fake.returns(null),
      },
    };
    const bluetoothManager = new BluetoothManager(gladys, serviceId);

    const result = bluetoothManager.completeDevice(null);
    expect(result).eq(null);
    assert.notCalled(gladys.stateManager.get);
  });

  it('unknown device', () => {
    const gladys = {
      stateManager: {
        get: fake.returns(null),
      },
    };
    const bluetoothManager = new BluetoothManager(gladys, serviceId);

    const device = {
      external_id: 'EXTERNAL',
    };
    const result = bluetoothManager.completeDevice(device);
    expect(result).eq(device);
    assert.calledOnce(gladys.stateManager.get);
  });

  it('merged device', () => {
    const gladys = {
      stateManager: {
        get: fake.returns({ service: 'bluetooth' }),
      },
    };
    const bluetoothManager = new BluetoothManager(gladys, serviceId);

    const device = {
      external_id: 'EXTERNAL',
    };
    const result = bluetoothManager.completeDevice(device);
    expect(result).deep.eq({
      service: 'bluetooth',
      external_id: 'EXTERNAL',
    });
    assert.calledOnce(gladys.stateManager.get);
  });
});
