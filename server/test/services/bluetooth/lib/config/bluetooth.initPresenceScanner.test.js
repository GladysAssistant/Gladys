const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const scanPresenceMock = fake.resolves(null);
const BluetoothManager = proxyquire('../../../../../services/bluetooth/lib', {
  './commands/bluetooth.scanPresence': { scanPresence: scanPresenceMock },
});

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.initPresenceScanner', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('stop scanner', async () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.presenceScanner = {
      status: 'disabled',
      timer,
    };

    bluetoothManager.initPresenceScanner();

    expect(bluetoothManager.presenceScanner.timer).eq(undefined);
    assert.notCalled(scanPresenceMock);
    assert.calledOnce(clock.clearInterval);
  });

  it('restart scanner, bluetooth is ready', async () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.ready = true;
    bluetoothManager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
      timer,
    };

    bluetoothManager.initPresenceScanner();

    expect(bluetoothManager.presenceScanner.timer).not.eq(undefined);
    assert.calledOnce(scanPresenceMock);
    assert.calledOnce(clock.clearInterval);

    clock.tick(6000);

    assert.callCount(scanPresenceMock, 2);
  });

  it('restart scanner, bluetooth not ready', async () => {
    sinon.spy(clock, 'clearInterval');

    const timer = setInterval(() => {}, 5000);

    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
      timer,
    };

    bluetoothManager.initPresenceScanner();

    expect(bluetoothManager.presenceScanner.timer).eq(undefined);
    assert.calledOnce(clock.clearInterval);
    assert.notCalled(scanPresenceMock);
  });

  it('start scanner, bluetooth is ready', async () => {
    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.ready = true;
    bluetoothManager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
    };

    bluetoothManager.initPresenceScanner();

    expect(bluetoothManager.presenceScanner.timer).not.eq(undefined);
    assert.calledOnce(scanPresenceMock);

    clock.tick(6000);

    assert.callCount(scanPresenceMock, 2);
  });

  it('start scanner, but bluetooth not ready', async () => {
    const bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.presenceScanner = {
      status: 'enabled',
      frequency: 5000,
    };

    bluetoothManager.initPresenceScanner();

    expect(bluetoothManager.presenceScanner.timer).eq(undefined);
    assert.notCalled(scanPresenceMock);
  });
});
