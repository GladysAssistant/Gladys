const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.poll command', () => {
  let bluetooth;
  let bluetoothManager;

  let peripheral;
  let service;
  let characteristic;

  beforeEach(() => {
    characteristic = {
      uuid: '2a6e',
      properties: ['read'],
      read: fake.yields(null, 'd'),
    };

    service = {
      uuid: '1809',
      discoverCharacteristics: fake.yields(null, [characteristic]),
    };

    peripheral = {
      uuid: 'uuid',
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
    if (bluetoothManager.scanPromise && bluetoothManager.scanPromise.isPending()) {
      bluetoothManager.scanPromise.cancel();
    }

    sinon.reset();
  });

  it('feature read value', async () => {
    const device = {
      external_id: 'bluetooth:uuid',
      features: [
        {
          external_id: 'bluetooth:uuid:1809:2a6e',
        },
      ],
    };

    await bluetoothManager.poll(device);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(peripheral.disconnect);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledOnce(characteristic.read);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE,
      payload: { peripheralLookup: false, ready: false, scanning: false },
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'bluetooth:uuid:1809:2a6e',
      state: 13,
    });
  });

  it('error on getCharacteristic', async () => {
    service.discoverCharacteristics = fake.yields(new Error('error'));

    const device = {
      external_id: 'bluetooth:uuid',
      features: [
        {
          external_id: 'bluetooth:uuid:1809:2a6e',
        },
      ],
    };

    await bluetoothManager.poll(device);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(peripheral.disconnect);
    assert.calledOnce(service.discoverCharacteristics);
    assert.notCalled(characteristic.read);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE,
      payload: { peripheralLookup: false, ready: false, scanning: false },
    });
  });
});
