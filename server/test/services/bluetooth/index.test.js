const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const BluetoothMock = require('./BluetoothMock.test');

const bluetooth = new BluetoothMock();

const StartLib = proxyquire('../../../services/bluetooth/lib/commands/bluetooth.start', {
  '@abandonware/noble': bluetooth,
});

const BluetoothManager = proxyquire('../../../services/bluetooth/lib', {
  './commands/bluetooth.start': StartLib,
});

const BluetoothService = proxyquire('../../../services/bluetooth', {
  './lib': BluetoothManager,
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  device: {
    get: () => [],
  },
  variable: {
    getValue: () => 'value',
  },
};

describe('BluetoothService', () => {
  let bluetoothService;

  beforeEach(() => {
    bluetoothService = BluetoothService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await bluetoothService.start();
    expect(bluetoothService.device.bluetooth).not.eq(undefined);
  });

  it('should stop service', async () => {
    bluetoothService.device.bluetooth = bluetooth;

    await bluetoothService.stop();

    // No more listener
    expect(bluetooth.eventNames()).is.lengthOf(0);

    assert.calledOnce(bluetooth.stopScanning);
  });
});
