const { expect } = require('chai');
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

  it('should clear timeout, and discovered devices', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.discoveredDevices = { one: {}, two: {} };

    bluetoothManager.scan(true);
    await bluetoothManager.scan(false);

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(stopScanning);
    assert.calledOnce(stopScanningAsync);

    expect(bluetoothManager.discoveredDevices).deep.eq({});
  });

  it('should clear timeout, and keep discovered devices', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.discoveredDevices = { one: {}, two: {} };
    bluetoothManager.scan(true, 'any');

    await bluetoothManager.scan(false);

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(stopScanning);
    assert.calledOnce(stopScanningAsync);

    expect(bluetoothManager.discoveredDevices).deep.eq({ one: {}, two: {} });
  });

  it('scan for in memory peripheral', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.discoveredDevices = { one: {}, two: {} };
    // eslint-disable-next-line no-underscore-dangle
    bluetooth._peripherals.any = { uuid: 'any' };

    const peripheral = await bluetoothManager.scan(true, 'any');

    assert.notCalled(bluetooth.startScanning);
    assert.notCalled(stopScanning);
    assert.notCalled(stopScanningAsync);

    expect(peripheral).deep.eq({ uuid: 'any' });
  });
});
