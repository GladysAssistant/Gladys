const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');

const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.stopScanPresence', () => {
  let bluetoothManager;
  let bluetooth;
  let clock;

  beforeEach(() => {
    bluetooth = new BluetoothMock();
    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('check only pending timers are well removed', async () => {
    sinon.spy(clock, 'clearInterval');

    bluetoothManager.presenceScanner.timer = setInterval(assert.fail, 5000);

    bluetoothManager.stopScanPresence();

    assert.calledOnce(clock.clearInterval);
    expect(bluetoothManager.presenceScanner.timer).eq(undefined);
  });
});
