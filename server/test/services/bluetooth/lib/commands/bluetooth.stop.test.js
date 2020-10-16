const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.stop command', () => {
  let bluetooth;
  let bluetoothManager;

  beforeEach(() => {
    bluetooth = new BluetoothMock();

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;
  });

  afterEach(() => {
    bluetooth.removeAllListeners();
    sinon.reset();
  });

  it('check listeners and peripherals are well removed', async () => {
    await bluetoothManager.stop();

    // No more listener
    expect(bluetooth.eventNames()).is.lengthOf(0);

    assert.calledOnce(bluetooth.stopScanningAsync);
  });
});
