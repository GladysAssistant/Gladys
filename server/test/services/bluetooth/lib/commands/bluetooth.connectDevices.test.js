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
  device: {
    get: fake.resolves([device]),
  },
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.connectDevices command', () => {
  let bluetooth;
  let bluetoothManager;

  let peripheral;
  let service;
  let characteristic;

  beforeEach(() => {
    characteristic = {
      uuid: '2a6e',
      properties: ['notify'],
      subscribe: fake.yields(null),
      on: fake.returns(null),
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
    sinon.reset();
  });

  it('subscribe to peripheral', async () => {
    await bluetoothManager.connectDevices();

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledOnce(characteristic.subscribe);
    assert.calledOnce(characteristic.on);
  });
});
