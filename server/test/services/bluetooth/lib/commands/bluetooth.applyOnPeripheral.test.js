const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.applyOnPeripheral command', () => {
  let peripheral;

  let bluetooth;
  let bluetoothManager;

  beforeEach(() => {
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
    };

    bluetooth = new BluetoothMock();
    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;
    bluetoothManager.ready = true;

    bluetooth.startScanning = () => {
      bluetooth.emit('discover', peripheral);
      bluetooth.emit('scanStop');
    };
  });

  it('exec fails', async () => {
    const error = fake.throws(new Error('error'));
    try {
      await bluetoothManager.applyOnPeripheral('uuid', error);
      assert.fail();
    } catch (e) {
      assert.calledOnce(error);
    }
  });
});
