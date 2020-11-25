const sinon = require('sinon');

const { fake, assert } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.scan command', () => {
  let bluetooth;
  let bluetoothManager;

  let stopScanning;
  let stopScanningAsync;

  beforeEach(() => {
    stopScanning = fake.returns(null);
    stopScanningAsync = fake.returns(null);

    bluetooth = new BluetoothMock();
    bluetooth.stopScanning = () => {
      if (bluetoothManager.scanPromise && bluetoothManager.scanPromise.isPending()) {
        bluetoothManager.scanPromise.cancel();
      }
      stopScanning();
    };
    bluetooth.stopScanningAsync = () => {
      if (bluetoothManager.scanPromise && bluetoothManager.scanPromise.isPending()) {
        bluetoothManager.scanPromise.cancel();
      }
      stopScanningAsync();
    };

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;
  });

  afterEach(() => {
    if (bluetoothManager.scanPromise && bluetoothManager.scanPromise.isPending()) {
      bluetoothManager.scanPromise.cancel();
    }

    sinon.reset();
  });

  it('should not scan, ready but no args', async () => {
    bluetoothManager.ready = true;
    await bluetoothManager.scan();

    assert.notCalled(bluetooth.startScanning);
    assert.notCalled(stopScanning);
    assert.calledOnce(stopScanningAsync);
  });

  it('should not scan, not ready no args', async () => {
    bluetoothManager.ready = false;
    try {
      await bluetoothManager.scan();
      assert.fail('Should have fail');
    } catch (e) {
      assert.notCalled(bluetooth.startScanning);
      assert.notCalled(stopScanning);
      assert.calledOnce(stopScanningAsync);
    }
  });

  it('should not scan, ready no scan', async () => {
    bluetoothManager.ready = true;
    await bluetoothManager.scan(false);

    assert.notCalled(bluetooth.startScanning);
    assert.notCalled(stopScanning);
    assert.calledOnce(stopScanningAsync);
  });

  it('should clear timeout', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.scan(true);

    await bluetoothManager.scan(false);

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(stopScanning);
    assert.calledOnce(stopScanningAsync);
  });
});
