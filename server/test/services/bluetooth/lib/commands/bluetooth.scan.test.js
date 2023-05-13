const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const { NotFoundError } = require('../../../../../utils/coreErrors');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.scan command', () => {
  let bluetooth;
  let bluetoothManager;

  let clock;

  beforeEach(() => {
    bluetooth = new BluetoothMock();
    bluetooth.stopScanning = fake.returns(null);
    bluetooth.stopScanningAsync = fake.returns(null);

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
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
      assert.notCalled(bluetooth.stopScanningAsync);
    }
  });

  it('should not scan, ready no scan', async () => {
    bluetoothManager.ready = true;
    await bluetoothManager.scan(false);

    assert.notCalled(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.calledOnce(bluetooth.stopScanningAsync);
  });

  it('should clear timeout, and discovered devices', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.discoveredDevices = { one: {}, two: {} };

    bluetoothManager.scan(true);
    await bluetoothManager.scan(false);

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.calledOnce(bluetooth.stopScanningAsync);

    expect(bluetoothManager.discoveredDevices).deep.eq({});
  });

  it('should clear timeout, and keep discovered devices', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.discoveredDevices = { one: {}, two: {} };
    bluetoothManager.scan(true, 'any');

    await bluetoothManager.scan(false);

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.calledOnce(bluetooth.stopScanningAsync);

    expect(bluetoothManager.discoveredDevices).deep.eq({ one: {}, two: {} });
  });

  it('scan for in memory peripheral', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.discoveredDevices = { one: {}, two: {} };
    // eslint-disable-next-line no-underscore-dangle
    bluetooth._peripherals.any = { uuid: 'any' };

    const peripheral = await bluetoothManager.scan(true, 'any');

    assert.notCalled(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.notCalled(bluetooth.stopScanningAsync);

    expect(peripheral).deep.eq({ uuid: 'any' });
  });

  it('should stop discover if device is not found', async () => {
    bluetoothManager.ready = true;

    const scanTimer = bluetoothManager.scan(true);

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.notCalled(bluetooth.stopScanningAsync);
    expect(bluetoothManager.scanTimer).to.be.not.equal(undefined);

    // wait for timeout
    clock.tick(150000);
    // check that scan is stopped after timeout
    assert.calledOnce(bluetooth.stopScanning);

    bluetooth.emit('scanStop');
    const result = await scanTimer;
    expect(result).to.be.deep.equal({});
  });

  it('should stop discover and reject if specific device is not found', async () => {
    bluetoothManager.ready = true;
    bluetoothManager.scanTimer = 'any-timer';

    const scanTimer = bluetoothManager.scan(true, 'device-uuid');

    assert.calledOnce(bluetooth.startScanning);
    assert.notCalled(bluetooth.stopScanning);
    assert.notCalled(bluetooth.stopScanningAsync);
    expect(bluetoothManager.scanTimer).to.be.not.equal(undefined);

    // wait for timeout
    clock.tick(150000);
    // check that scan is stopped after timeout
    assert.calledOnce(bluetooth.stopScanning);

    bluetooth.emit('scanStop');
    try {
      await scanTimer;
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.be.equal('Bluetooth: peripheral device-uuid not found');
    }
  });
});
