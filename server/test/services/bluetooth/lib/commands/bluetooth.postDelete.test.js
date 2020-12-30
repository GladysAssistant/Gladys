const sinon = require('sinon');

const { fake, assert } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const device = {
  external_id: 'bluetooth:uuid',
  features: [
    {
      external_id: 'bluetooth:uuid:1809:2a6e',
    },
  ],
};
const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.postDelete command', () => {
  let bluetooth;
  let bluetoothManager;

  let peripheral;
  let service;
  let characteristic;

  beforeEach(() => {
    characteristic = {
      uuid: '2a6e',
      properties: ['notify'],
      unsubscribe: fake.yields(null),
    };

    service = {
      uuid: '1809',
      discoverCharacteristics: fake.yields(null, [characteristic]),
    };

    peripheral = {
      uuid: 'uuid',
      connectable: true,
      connect: fake.yields(null),
      discoverServices: fake.yields(null, [service]),
    };

    bluetooth = new BluetoothMock();

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;
    bluetooth.startScanning = () => {
      bluetooth.emit('discover', peripheral);
      bluetooth.emit('scanStop');
    };
  });

  afterEach(() => {
    if (bluetoothManager.scanPromise && bluetoothManager.scanPromise.isPending()) {
      bluetoothManager.scanPromise.cancel();
    }

    sinon.reset();
  });

  it('unsubscribe to peripheral', async () => {
    await bluetoothManager.postDelete(device);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledOnce(characteristic.unsubscribe);
  });

  it('unsubscribe to peripheral with error', async () => {
    peripheral.discoverServices = fake.yields('error');

    await bluetoothManager.postDelete(device);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.discoverServices);
    assert.notCalled(service.discoverCharacteristics);
    assert.notCalled(characteristic.unsubscribe);
  });

  it('unsubscribe to peripheral with error (on connect)', async () => {
    peripheral.connect = fake.yields(new Error('error'));

    await bluetoothManager.postDelete(device);

    assert.calledOnce(peripheral.connect);
    assert.notCalled(peripheral.discoverServices);
    assert.notCalled(service.discoverCharacteristics);
    assert.notCalled(characteristic.unsubscribe);
  });
});
