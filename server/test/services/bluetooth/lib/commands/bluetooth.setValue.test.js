const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.setValue command', () => {
  let characteristic;
  let service;
  let peripheral;

  let bluetooth;
  let bluetoothManager;

  beforeEach(() => {
    characteristic = {
      uuid: '2a00',
      properties: ['write'],
      write: fake.yields(null),
    };

    service = {
      uuid: '1800',
      discoverCharacteristics: fake.yields(null, [characteristic]),
    };

    peripheral = {
      uuid: 'uuid',
      address: 'A1',
      addressType: 'public',
      rssi: 'R1',
      advertisement: {
        localName: 'P1',
      },
      lastSeen: 'D1',
      connectable: true,
      connect: fake.yields(null),
      disconnect: fake.resolves(null),
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

  it('should write on peripheral', async () => {
    const device = {};
    const feature = {
      external_id: 'bluetooth:uuid:1800:2a00',
    };
    const value = 1;

    await bluetoothManager.setValue(device, feature, value);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledOnce(characteristic.write);

    assert.calledOnce(gladys.event.emit);
  });
});
