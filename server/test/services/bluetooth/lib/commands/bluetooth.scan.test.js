const sinon = require('sinon');

const { assert } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.scan command', () => {
  let bluetooth;
  let bluetoothManager;
  let clock;

  beforeEach(() => {
    bluetooth = new BluetoothMock();

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    bluetooth.removeAllListeners();
    clock.restore();
    sinon.reset();
  });

  it('should not scan, ready but no args', async () => {
    bluetoothManager.ready = true;
    await bluetoothManager.scan();

    assert.notCalled(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.calledOnce(bluetooth.stopScanningAsync);
  });

  it('should not scan, not ready no args', async () => {
    bluetoothManager.ready = false;
    try {
      await bluetoothManager.scan();
      assert.fail('Should have fail');
    } catch (e) {
      assert.notCalled(bluetooth.startScanning);
      assert.notCalled(bluetooth.stopScanning);
      assert.calledOnce(bluetooth.stopScanningAsync);
    }
  });

  it('should not scan, ready no scan', async () => {
    bluetoothManager.ready = true;
    await bluetoothManager.scan(false);

    assert.notCalled(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.calledOnce(bluetooth.stopScanningAsync);
  });

  it('should clear timeout', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.scan(true);

    await bluetoothManager.scan(false);

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.calledOnce(bluetooth.stopScanningAsync);
  });
});
