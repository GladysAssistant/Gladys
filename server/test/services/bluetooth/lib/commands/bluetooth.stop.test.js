const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.stop command', () => {
  let bluetooth;
  let bluetoothManager;
  let clock;

  beforeEach(() => {
    bluetooth = new BluetoothMock();

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;
    bluetoothManager.discoveredDevices = { any: 'any' };
    bluetoothManager.scanCounter = 12;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    bluetooth.removeAllListeners();
    clock.restore();
    sinon.reset();
  });

  it('check listeners and peripherals are well removed', async () => {
    await bluetoothManager.stop();

    expect(bluetoothManager.bluetooth).eq(undefined);
    expect(bluetoothManager.discoveredDevices).deep.eq({});
    expect(bluetoothManager.scanPromise).eq(undefined);
    expect(bluetoothManager.scanCounter).eq(0);

    // No more listener
    expect(bluetooth.eventNames()).is.lengthOf(0);

    assert.calledOnce(bluetooth.stopScanning);
  });

  it('check only pending timers are well removed', async () => {
    sinon.spy(clock, 'clearInterval');

    bluetoothManager.presenceScanner.timer = setInterval(assert.fail, 5000);

    const scanPromise = {
      isPending: () => false,
      cancel: fake.returns(false),
    };
    bluetoothManager.scanPromise = scanPromise;

    await bluetoothManager.stop();

    assert.calledOnce(bluetooth.stopScanning);
    assert.calledOnce(clock.clearInterval);
    assert.notCalled(scanPromise.cancel);
  });

  it('check timers are well removed', async () => {
    sinon.spy(clock, 'clearInterval');

    bluetoothManager.presenceScanner.timer = setInterval(assert.fail, 5000);
    const scanPromise = {
      isPending: () => true,
      cancel: fake.returns(false),
    };
    bluetoothManager.scanPromise = scanPromise;

    await bluetoothManager.stop();

    assert.calledOnce(bluetooth.stopScanning);
    assert.calledOnce(clock.clearInterval);
    assert.calledOnce(scanPromise.cancel);
  });
});
